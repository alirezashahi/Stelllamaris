// top-level module
import fs from 'fs';
import https from 'https';
import 'dotenv/config';

const CHECKLIST_PATH = process.env.CHECKLIST_PATH || 'c:\\Users\\shahi\\Desktop\\Stella maris\\Stelllamaris\\DEVELOPMENT_CHECKLIST.md';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER_RAW = process.env.GITHUB_OWNER;
const GITHUB_OWNER = GITHUB_OWNER_RAW ? GITHUB_OWNER_RAW.replace(/^@/, '').trim() : GITHUB_OWNER_RAW;
const GITHUB_REPO = process.env.GITHUB_REPO;

const TRELLO_KEY = process.env.TRELLO_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_BOARD_ID = process.env.TRELLO_BOARD_ID;
// JSON string map like: {"Phase 3":"<listIdPhase3>","Phase 4":"<listIdPhase4>"}
const PHASE_LIST_MAP = process.env.PHASE_LIST_MAP ? JSON.parse(process.env.PHASE_LIST_MAP) : {};

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
  console.error('Missing GitHub env: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO');
  process.exit(1);
}
if (!TRELLO_KEY || !TRELLO_TOKEN || !TRELLO_BOARD_ID) {
  console.error('Missing Trello env: TRELLO_KEY, TRELLO_TOKEN, TRELLO_BOARD_ID');
  process.exit(1);
}
// Basic validation to catch common mistakes (e.g., spaces in token/key)
if (/\s/.test(TRELLO_TOKEN) || /\s/.test(TRELLO_KEY)) {
  console.error('Invalid Trello credentials: spaces detected in TRELLO_KEY or TRELLO_TOKEN. Please set real API key/token.');
  process.exit(1);
}

function ghRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'User-Agent': 'sync-script',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body ? JSON.parse(body) : {});
        } else {
          reject(new Error(`GitHub ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function trelloRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const urlPath = `${path}${path.includes('?') ? '&' : '?'}key=${encodeURIComponent(TRELLO_KEY)}&token=${encodeURIComponent(TRELLO_TOKEN)}`;
    const options = {
      hostname: 'api.trello.com',
      path: `/1${urlPath}`,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body ? JSON.parse(body) : {});
        } else {
          reject(new Error(`Trello ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function ensureMilestone(title) {
  const milestones = await ghRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/milestones`);
  const existing = milestones.find(m => m.title === title);
  if (existing) return existing;
  return ghRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/milestones`, 'POST', { title });
}

async function ensureLabel(name, color = 'ededed', description = '') {
  try {
    return await ghRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/labels/${encodeURIComponent(name)}`);
  } catch {
    return ghRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/labels`, 'POST', { name, color, description });
  }
}

function parseChecklist(md) {
  const lines = md.split('\n');
  let currentPhase = null;
  let currentSection = null;
  const tasks = [];
  for (const line of lines) {
    const phaseMatch = line.match(/^##\s+.*Phase\s+(\d+)/i);
    if (phaseMatch) {
      currentPhase = `Phase ${phaseMatch[1]}`;
      currentSection = null;
      continue;
    }
    const sectionMatch = line.match(/^###\s+(.*)/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      continue;
    }
    const taskMatch = line.match(/^- \[ \]\s+(.*)/); // unchecked only
    if (taskMatch && currentPhase && currentSection) {
      tasks.push({
        phase: currentPhase,
        section: currentSection,
        title: taskMatch[1].trim()
      });
    }
  }
  return tasks;
}

async function createIssue(task, milestoneId) {
  const title = `[${task.phase}] ${task.section} — ${task.title}`;
  const body = [
    `Source: \`${CHECKLIST_PATH}\` → ${task.phase}/${task.section}`,
    '',
    '## Scope',
    '- [ ] Implementation',
    '- [ ] Tests',
    '- [ ] Docs',
    '- [ ] Analytics (if applicable)',
    '',
    '## Acceptance Criteria',
    '- [ ] Define verifiable criteria for completion',
    '',
    '## Links',
    '- Trello: (added by script below)'
  ].join('\n');

  await ensureLabel(`phase:${task.phase.split(' ')[1]}`);
  await ensureLabel(`section:${task.section}`);
  await ensureLabel('type:feature');

  return ghRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, 'POST', {
    title,
    body,
    labels: [`phase:${task.phase.split(' ')[1]}`, `section:${task.section}`, 'type:feature'],
    milestone: milestoneId
  });
}

async function getOrCreatePhaseList(phase) {
  if (PHASE_LIST_MAP[phase]) return PHASE_LIST_MAP[phase];
  // Try to find a list named with the phase; if not found, create it.
  const lists = await trelloRequest(`/boards/${TRELLO_BOARD_ID}/lists`);
  const match = lists.find(l => l.name === phase);
  if (match) return match.id;
  const created = await trelloRequest(`/lists?name=${encodeURIComponent(phase)}&idBoard=${TRELLO_BOARD_ID}`, 'POST');
  return created.id;
}

async function createTrelloCard(task, issueUrl) {
  const idList = await getOrCreatePhaseList(task.phase);
  const name = `[${task.phase}] ${task.section} — ${task.title}`;
  const desc = `GitHub Issue: ${issueUrl}\n\nSource: ${CHECKLIST_PATH} → ${task.phase}/${task.section}`;
  return trelloRequest(`/cards?idList=${idList}&name=${encodeURIComponent(name)}&desc=${encodeURIComponent(desc)}`, 'POST');
}

async function main() {
  const md = fs.readFileSync(CHECKLIST_PATH, 'utf-8');
  const tasks = parseChecklist(md);
  console.log(`Found ${tasks.length} unchecked tasks.`);

  const phases = Array.from(new Set(tasks.map(t => t.phase)));
  const milestoneMap = {};
  for (const phase of phases) {
    const milestone = await ensureMilestone(phase);
    milestoneMap[phase] = milestone.number;
    await ensureLabel(`phase:${phase.split(' ')[1]}`, 'f27c0b', 'Phase grouping');
  }

  for (const task of tasks) {
    try {
      const issue = await createIssue(task, milestoneMap[task.phase]);
      const issueUrl = issue.html_url;
      await createTrelloCard(task, issueUrl);
      console.log(`Created: ${issue.title}`);
    } catch (err) {
      console.error(`Failed for task "${task.title}": ${err.message}`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
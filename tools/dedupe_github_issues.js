import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER_RAW = process.env.GITHUB_OWNER;
const GITHUB_OWNER = GITHUB_OWNER_RAW ? GITHUB_OWNER_RAW.replace(/^@/, '').trim() : GITHUB_OWNER_RAW;
const GITHUB_REPO = process.env.GITHUB_REPO;

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
  console.error('Missing GitHub env: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO');
  process.exit(1);
}

function ghRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'User-Agent': 'dedupe-script',
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

async function ensureLabel(name) {
  try {
    return await ghRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/labels/${encodeURIComponent(name)}`);
  } catch {
    return ghRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/labels`, 'POST', { name, color: 'b60205', description: 'Duplicate issue' });
  }
}

async function listAllIssues(state = 'open') {
  const perPage = 100;
  let page = 1;
  const all = [];
  while (true) {
    const res = await ghRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=${state}&per_page=${perPage}&page=${page}`);
    if (!Array.isArray(res) || res.length === 0) break;
    all.push(...res);
    if (res.length < perPage) break;
    page += 1;
  }
  return all;
}

async function addComment(issueNumber, body) {
  return ghRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}/comments`, 'POST', { body });
}

async function addLabels(issueNumber, labels) {
  return ghRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}/labels`, 'POST', { labels });
}

async function closeIssue(issueNumber) {
  return ghRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}`, 'PATCH', { state: 'closed' });
}

async function ghGraphQLRequest(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query, variables });
    const options = {
      hostname: 'api.github.com',
      path: '/graphql',
      method: 'POST',
      headers: {
        'User-Agent': 'dedupe-script',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          if (res.statusCode >= 200 && res.statusCode < 300 && !parsed.errors) {
            resolve(parsed.data || {});
          } else {
            reject(new Error(`GitHub GraphQL ${res.statusCode}: ${body}`));
          }
        } catch (e) {
          reject(new Error(`GitHub GraphQL parse error: ${e.message} | raw: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function deleteIssueByNodeId(issueNodeId) {
  const mutation = `mutation($issueId: ID!) {\n    deleteIssue(input: { issueId: $issueId }) {\n      clientMutationId\n    }\n  }`;
  return ghGraphQLRequest(mutation, { issueId: issueNodeId });
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const issues = await listAllIssues('open');

  // Group by exact title
  const map = new Map();
  for (const issue of issues) {
    const t = issue.title;
    if (!map.has(t)) map.set(t, []);
    map.get(t).push(issue);
  }

  let duplicatesFound = 0;
  for (const [title, list] of map.entries()) {
    if (list.length > 1) {
      duplicatesFound += (list.length - 1);
      // Keep the oldest by created_at
      const sorted = list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const canonical = sorted[0];
      const dups = sorted.slice(1);
      for (const dup of dups) {
        if (dryRun) {
          console.log(`[DRY-RUN] Would delete #${dup.number} titled "${title}" → canonical #${canonical.number}`);
        } else {
          await deleteIssueByNodeId(dup.node_id);
          console.log(`Deleted #${dup.number} as duplicate of #${canonical.number}`);
        }
      }
    }
  }

  if (duplicatesFound === 0) {
    console.log('No duplicate open issues found by exact title.');
  } else {
    console.log(`Processed ${duplicatesFound} duplicate issues.`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
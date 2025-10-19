# Email Confirmation Setup (Resend)

This guide connects the Stellamaris checkout flow to Resend to send order confirmation emails securely from the Convex backend.

## Prerequisites
- Resend account with a verified sending domain (e.g., `stellamaris.com`).
- Resend API key (with permissions to send emails).
- Running Convex project (`npx convex dev`) for local development.

## Environment Variables (Convex)
Set the following in your Convex environment (these are read inside `convex/emails.ts`):

- `RESEND_API_KEY` (required): Your Resend API key.
- `EMAIL_FROM` (recommended): A verified sender address, e.g., `orders@info.thestellamaris.shop`.

Commands:

npx convex env set RESEND_API_KEY "<YOUR_RESEND_API_KEY>"
npx convex env set EMAIL_FROM "orders@info.thestellamaris.shop"
npx convex env set EMAIL_FROM_NAME "Stellamaris"

If your dev server is already running, restart it to pick up changes.

## Code Integration
- Email action: `convex/emails.ts` → `sendOrderConfirmationEmail`
- It builds the email from `orders.getOrderByNumber` and posts to Resend REST API.
- Checkout wiring: `src/components/pages/CheckoutPage.tsx` calls the action after a successful `createOrder`.

## Customization
- Edit the HTML template inside `renderOrderEmailHtml` to match your brand.
- Charity name mapping mirrors the UI; adjust in `charityName` if needed.
- Subject and from-address are configurable by environment variables.

## Testing
- Use a test recipient address to confirm delivery.
- Check Resend dashboard for logs and delivery status.
- If emails fail, verify that:
  - `RESEND_API_KEY` is set and valid.
  - `EMAIL_FROM` is from a verified domain.
  - The action runs without errors (see browser console logs during checkout).

## Notes
- The email send runs after order creation and does not block checkout.
- Errors are logged but do not prevent user navigation to order history.
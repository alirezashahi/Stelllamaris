# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-10-19
### Changed
- Updated email sender fallback to `orders@info.thestellamaris.shop`.
- Aligned order query validators and handlers to include `productId`/`variantId` in `items` for `orders.getUserOrders` and `orders.getOrderByNumber`.
- Enhanced order confirmation email to include product images (variant-primary or product-primary when available).
- Updated `EMAIL_CONFIRMATION_SETUP.md` to reflect the new sender domain and environment commands.

### Fixed
- Resolved TypeScript validator mismatch causing `ReturnsValidationError` in `orders:getOrderByNumber` and `emails:sendOrderConfirmationEmail`.

## [0.1.0] - 2025-10-18
### Added
- Order confirmation emails via Resend:
  - Convex action `sendOrderConfirmationEmail` in `convex/emails.ts`.
  - Checkout integration calling the action after `orders.createOrder` in `src/components/pages/CheckoutPage.tsx`.
- `EMAIL_CONFIRMATION_SETUP.md` with environment variables and setup steps for Resend.
- Versioning note appended to `DEVELOPMENT_CHECKLIST.md` referencing this changelog.

### Notes
- Email send is non-blocking and logs errors without interrupting checkout flow.
- Requires `RESEND_API_KEY`, `EMAIL_FROM`, and optional `EMAIL_FROM_NAME` configured via `npx convex env set`.
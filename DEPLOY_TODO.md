# Deployment Readiness Checklist

Use this checklist to take Impressa from dev to a production-ready, secure deployment.

## 1) Security and Validation
- [ ] Add request validation (zod/express-validator) for all endpoints (auth, products, orders, reports)
- [ ] Sanitize and normalize inputs; escape/strip HTML where appropriate
- [ ] File upload hardening: set multer limits (e.g., 10MB, 1 file), MIME sniff (file-type), allow only image/PDF
- [ ] Add helmet for security headers; review CORS to restrict origins and methods
- [ ] Enforce rate limiting on public endpoints (/orders/public, /orders/track/:id)
- [ ] Secrets management: never commit .env; document environment variables; validate with envalid/zod

## 2) Auth and Sessions
- [ ] Standardize token naming (e.g., accessToken) and storage on frontend
- [ ] Implement customer login/register UI; ensure axios uses the same token key
- [ ] Add refresh token rotation and secure storage rules (httpOnly cookies if migrating from localStorage)
- [ ] Protect admin-only routes; verify RBAC consistently

## 3) API Quality and Error Handling
- [ ] Centralize error handler middleware with consistent JSON: { message, code?, details? }
- [ ] Avoid generic 500; attach safe error codes
- [ ] Add pagination, filtering, and sorting to list endpoints
- [ ] Document and enforce response schemas

## 4) Orders and Guest Checkout
- [ ] Ensure Order.publicId uniqueness with retry on duplicate key
- [ ] Email receipt to guests with tracking link to /track?query={publicId}
- [ ] Add order confirmation page in frontend with tracking ID display and “copy” button

## 5) Reporting and PDFs
- [ ] Add timeout and retry for chart image generation; skip gracefully with a note
- [ ] Cache charts by (report-type, month, year) for 15 min
- [ ] Confirm logo asset paths in all environments; add fallback text
- [ ] Add e2e test to render a monthly PDF successfully

## 6) Frontend Standards & UX
- [ ] Use env-based API base URL (REACT_APP_API_BASE_URL) and document
- [ ] Adopt React Query/SWR for data fetching states and caching
- [ ] Improve accessibility: labels, alt text, focus states, semantic headings
- [ ] Tailwind plugin for line-clamp or replace with CSS clamp utilities
- [ ] Persist cart customization files if needed (draft uploads or IndexedDB)

## 7) Backend Structure & Logging
- [ ] Clean up server.js route mounting (no duplicates) and order of middlewares
- [ ] Replace console logs with pino/winston; add request logging (pino-http/morgan)
- [ ] Split controllers/services cleanly; keep controllers thin

## 8) Database & Data
- [ ] Ensure indexes on: Order.publicId (unique), createdAt, frequently filtered fields
- [ ] Add seed scripts for dev (products, admin user)
- [ ] Create backup/restore procedures for MongoDB

## 9) Testing
- [ ] Backend unit tests (services) and integration tests (routes) with Jest + Supertest
- [ ] Frontend unit tests (React Testing Library) for cart, checkout, tracking
- [ ] E2E tests with Playwright/Cypress covering: browse, add-to-cart, guest checkout, tracking, admin report

## 10) Observability and Ops
- [ ] /health and /ready endpoints for monitoring
- [ ] Structured logging; log correlation IDs
- [ ] Error tracking (Sentry/Bugsnag) in both client and server

## 11) CI/CD & Deployment
- [ ] GitHub Actions: lint, test, build for frontend and backend
- [ ] Build artifacts and deploy to staging; manual approval to production
- [ ] Ensure node-cron runs in only one instance (dedicated worker or distributed lock)
- [ ] Containerization (Docker) with production Dockerfiles and compose/k8s manifests

## 12) Performance
- [ ] Verify Mongo query plans; add indexes where needed
- [ ] Enable gzip/br compression; cache static assets
- [ ] Use CDN for images if applicable

## 13) Documentation & Legal
- [ ] OpenAPI/Swagger for public endpoints (products, order creation/tracking)
- [ ] Update READMEs (env setup, base URLs, scripts, report endpoints)
- [ ] Operational runbook (rotation of keys, backups, recovery)
- [ ] Privacy policy and Terms (for guest/customer data)

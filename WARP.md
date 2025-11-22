# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

This is a full‑stack MERN monorepo for customizable product orders with admin analytics and reporting.

Packages:
- `impressa/impressa-backend`: Node/Express API, authentication, orders, analytics, PDF/CSV report generation, scheduled reports.
- `impressa/impressa-frontend`: React admin dashboard and reports UI.

For details on report templates and issues, refer to:
- `PDF_TEMPLATES_README.md`
- `REPORT_TROUBLESHOOTING.md`

## Common commands

All commands below are run from the repository root unless otherwise noted.

### Backend (API & reporting)

Location: `impressa/impressa-backend`

- Install dependencies:
  - `cd impressa/impressa-backend && npm install`
- Run in development (nodemon):
  - `cd impressa/impressa-backend && npm run dev`
- Run with plain Node:
  - `cd impressa/impressa-backend && npm start`

There are no configured automated tests or lint scripts in the backend `package.json` at the moment.

Environment variables (see `impressa/impressa-backend/README.md`):
- Required: `MONGO_URI`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`
- Optional: `COHERE_API_KEY`, `PORT`, `FRONTEND_URL`

### Frontend (React admin UI)

Location: `impressa/impressa-frontend`

- Install dependencies:
  - `cd impressa/impressa-frontend && npm install`
- Start development server:
  - `cd impressa/impressa-frontend && npm start`
- Build production bundle:
  - `cd impressa/impressa-frontend && npm run build`
- Run tests (Create React App test runner):
  - `cd impressa/impressa-frontend && npm test`

The frontend expects the backend API at `http://localhost:5000/api` by default (see `src/utils/axiosInstance.js`). You can override this with `REACT_APP_API_URL`.

## High‑level architecture

### Monorepo layout

- `README.md`: high‑level repo overview, setup, and links to reporting docs.
- `impressa/impressa-backend`: Express server, MongoDB models, business logic for orders/products, reporting and analytics, scheduled monthly reports.
- `impressa/impressa-frontend`: React dashboard (Create React App + Tailwind) for admin users, including a dedicated Reports page.

Backend and frontend communicate over REST under the `/api` prefix. The frontend uses `axios` with a shared instance (`src/utils/axiosInstance.js`) that injects a Bearer token from `localStorage` and targets `/api` (or `REACT_APP_API_URL`).

### Backend architecture

Backend entrypoint: `impressa/impressa-backend/server.js`.

Key responsibilities of `server.js`:
- Loads configuration via `dotenv` and connects to MongoDB before registering routes.
- Sets up security and infrastructure middleware: `helmet`, CORS (including support for `FRONTEND_URL` and localhost dev), JSON/body parsing, cookies, and HTTP logging via `pino-http` with a shared logger (`config/logger.js`).
- Exposes static uploads under `/uploads` for product images or custom files.
- Registers health probes at `/health` and `/live` and various API route groups under `/api/*`.
- Adds a top‑level `/api` info route returning basic metadata.
- Registers `notFound` and `errorHandler` middleware last, then configures graceful shutdown handlers for process signals and fatal errors.

Routing is organized by domain, each mapping to controllers and models:
- `routes/*.js`: route modules such as `authRoutes`, `productRoutes`, `orderRoutes`, `analyticsRoutes`, `reportRoutes`, `dashboardRoutes`, `cartRoutes`, `couponRoutes`, `checkoutRoutes`, `paymentRoutes`, `categoryRoutes`, `customizationRoutes`, and `healthRoutes`.
- `controllers/*.js`: per‑domain controllers implement request handling and orchestrate models/services. Example: `controllers/orderController.js` handles placing orders (including guest orders), tracking by public ID, filtering and status updates, order analytics, and report generation.
- `models/*.js`: Mongoose models for `User`, `Product`, `Order`, `Cart`, `Category`, `Coupon`, `Customization`, `ReportLog`, etc.
- `middleware/*.js`: cross‑cutting concerns such as `authMiddleware` (JWT/role checks, including `verifyAdmin` used for protected reporting routes), request validation, rate limiting, file uploads, and error handling (`errorHandler`, `notFound`).

#### Reporting pipeline (PDF/CSV + AI summaries)

Reporting logic is spread across controllers, services, utils, and a cron job:

- Entrypoints for report generation:
  - `controllers/orderController.generateReport`: main endpoint behind `GET /api/orders/report`.
  - `routes/reportRoutes.js`: `GET /api/reports/generate` for user table reports (PDF or CSV) based on `type=users&format=pdf|csv`.

- Report data construction:
  - `services/reportBuilders.js` provides `buildReportData(type, filters)` which dispatches to specialised builders:
    - `monthly`, `daily`, and `custom-range` reports via shared `getRangeReport(start, end)`.
    - `customer` reports summarizing orders for a specific customer.
    - `status` reports focused on a single order status.
    - `revenue` reports computing revenue and top products for a given date range.
  - `getRangeReport` aggregates orders, status counts, and customization usage (text/file/cloud link), and determines top products/customizations.

- PDF layout and rendering:
  - `utils/pdfLayout.js` defines `createimpressaPDF({ title, contentBuilder, signatory, logoPath })` which encapsulates:
    - Consistent headers (logo, company name, report title, date) and footers (contact info, page number, timestamp).
    - Helpers passed into `contentBuilder` for reusable constructs (`section`, `keyValue`, `table` with pagination, zebra striping, and header rows on each page).
    - A standardized approval block (prepared by, title, signature and stamp images) across all reports.
  - Controllers and jobs pass a `contentBuilder(doc, helpers)` that uses these utilities to render:
    - Executive summaries (including AI‑generated text).
    - Key metrics (grid layout across columns).
    - Tabular data for orders, products, users, etc.

- AI summary & logging:
  - `utils/aiSummary.js` (referenced from controllers and the scheduler) produces a summary string per report type, which is stored in the `ReportLog` model.
  - `models/ReportLog.js` records generated reports, their filters, formats, and AI summaries.
  - `utils/logCsvExporter.js` can export report logs as CSV.

- CSV export:
  - `utils/csvExporter.js` converts order datasets to CSV for `format=csv` report responses.
  - `routes/reportRoutes.js` implements a dedicated CSV export for user tables.

- Scheduled monthly reports:
  - `jobs/scheduledReports.js` uses `node-cron` to schedule a monthly report at 08:00 on the first day of each month.
  - It finds an admin user, builds a `monthly` report via `buildReportData`, generates an AI summary, logs the report, renders a PDF with `createimpressaPDF`, writes it to `reports/monthly-<month>-<year>.pdf`, and emails it to the admin using `utils/sendReportEmail.js`.

This reporting pipeline is tightly integrated: if you modify report fields or filters, ensure consistency across `orderController.generateReport`, `reportBuilders.js`, `AdminReports.jsx`, and any CSV exporters.

### Frontend architecture

Frontend entrypoint: standard Create React App structure under `impressa/impressa-frontend`.

Key pieces relevant to backend integration and reports:

- HTTP layer:
  - `src/utils/axiosInstance.js` creates a shared `axios` client with:
    - `baseURL` = `process.env.REACT_APP_API_URL || "/api"`.
    - `withCredentials: true` for cookie support.
    - An interceptor that attaches `Authorization: Bearer <authToken>` if `authToken` exists in `localStorage`.
  - This instance is used throughout the app (e.g., in `AdminReports.jsx`) for authenticated API calls.

- Layout and navigation:
  - Components like `src/components/Sidebar.jsx` and `src/components/Topbar.jsx` provide the admin layout and navigation shell.
  - Domain‑specific components such as `DashboardCards`, `CustomizationChart`, `CustomizationDemandTable`, `AdminChatBot`, `CreateUserForm`, etc., render analytics and management views using data from the backend.

- Reports UI:
  - `src/pages/AdminReports.jsx` is the primary interface for generating and reviewing reports.
  - It manages local state for `type`, `format`, and date filters (`from`, `to`), and integrates closely with backend expectations:
    - `type` options: `monthly`, `daily`, `custom-range`, `customer`, `status`, `revenue`.
    - For `monthly`, it automatically sets `month` and `year` to the current month/year.
    - For `daily`, it uses `date` (either selected or today).
    - For `custom-range` and `revenue`, it maps `from`/`to` to `start`/`end` query params.
  - For PDF reports:
    - Builds `URLSearchParams` with the appropriate filters and calls the `/orders/report` endpoint directly via `fetch`, including the Bearer token header.
    - Streams the PDF as a blob, then opens it in a new tab; if popups are blocked, it falls back to downloading the file.
  - For CSV reports:
    - Uses the shared `api` instance with `responseType: "blob"`, creates an object URL, and triggers a CSV download.
  - Report logs:
    - Fetches logs from `GET /orders/report/logs` using `api.get`, and renders a table summarizing timestamp, type, format, generator, and AI summary.
    - Offers a “Download Logs CSV” action which hits the same endpoint with `format=csv` and downloads the resulting CSV.

When modifying report types, filters, or routes, update both the backend dispatcher (`buildReportData` and controllers) and the Admin Reports UI to keep query parameters and supported types in sync.

## Notes for future agents

- Use the backend README (`impressa/impressa-backend/README.md`) and the root `README.md` as authoritative references for environment variables, API endpoints, and the overall reporting feature.
- For any work touching report templates, PDF layout, or scheduled reports, read:
  - `PDF_TEMPLATES_README.md` for visual/layout conventions and usage guidance.
  - `REPORT_TROUBLESHOOTING.md` for known failure modes and debugging steps.
- There are no centralized monorepo scripts; operate at the package level (`impressa-backend` and `impressa-frontend`).

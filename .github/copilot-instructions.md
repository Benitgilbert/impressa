# Impressa AI Agent Instructions

Impressa is a **MERN monorepo** for customizable product orders with admin analytics. This guide helps AI agents navigate architecture, workflows, and project-specific patterns.

## 🏗️ Architecture Overview

**Monorepo Structure:**
- `impressa-backend/` – Express + Mongoose API (Node.js 18+)
- `impressa-frontend/` – React 19 admin dashboard with Tailwind CSS
- Shared: Documentation in root, environment-driven CORS/CORS policy

**Key Architectural Decisions:**
1. **Server-side PDF generation** (not client): All reports use `pdfLayout.js` (PDFKit template) to ensure consistency. Frontend opens PDFs in a new tab via `/api/orders/report?format=pdf`.
2. **JWT + role-based access**: Auth middleware in `middleware/authMiddleware.js` uses Bearer tokens and role checks (`["admin"]` for admin-only routes).
3. **Context + Axios for state**: Frontend uses React Context (`CartContext`, `WishlistContext`) + custom `axiosInstance.js` with auto-injected JWT bearer tokens.
4. **Async route imports**: `server.js` imports routes *after* MongoDB connects to prevent initialization errors.
5. **Service layer for complex logic**: Report building, payment processing, and email notifications abstracted to `services/` and `utils/`.

## 📋 Data Models & Relationships

**Core Entities:**
- **User** – Admin/customer with JWT-encoded role
- **Product** – Customizable items with variations (sizes, colors), grouped by `Category`
- **Order** – Multi-item cart with `items[]`, addresses, status workflow (pending→processing→shipped→delivered)
- **Cart** – Cookie-based session (guest) or user-linked, supports coupons
- **Coupon** – Discount codes with usage limits, category/product constraints
- **ReportLog** – Audit trail: type, filters, AI summary, generated timestamp

**Status Workflows:**
- **Order**: `pending` → `processing` → `shipped` → `delivered` (admin updates)
- **Payment** (MTN MoMo): `pending` → `completed` or `failed`

## 🔌 API Route Structure

Routes are modular and mounted under `/api`:
```
/api/auth           → authController (login, register, forgot-password)
/api/products       → productController (CRUD, filtering by category/price)
/api/categories     → categoryController (tree structure, parent-child)
/api/cart           → cartController (add/remove items, apply coupons)
/api/checkout       → checkoutController (shipping calc, order creation)
/api/payments       → paymentController (MTN MoMo initiate/verify)
/api/orders         → orderController (CRUD, report generation, tracking)
/api/reports        → reportRoutes (users PDF, custom report generation)
/api/dashboard      → dashboardController (admin analytics)
/api/analytics      → analyticsController (top products, revenue)
/health, /ready     → health checks (load balancer probes)
```

**Report API** (Key Pattern):
- `GET /api/orders/report?type=monthly|daily|custom-range|customer|status|revenue&format=pdf|csv`
- `GET /api/reports/generate?type=users&format=pdf|csv`
- Returns PDF inline or CSV attachment; front-end opens in new tab

## 🛠️ Critical Developer Workflows

### Start Development
```powershell
# Terminal 1: Backend
cd impressa\impressa-backend
npm install  # If needed
npm run dev  # Runs on :5000 with nodemon

# Terminal 2: Frontend
cd impressa\impressa-frontend
npm install  # If needed
npm start    # React dev server on :3000
```

### Environment Configuration
Create `.env` in `impressa-backend/`:
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/impressa
JWT_SECRET=your-secret-key-min-32-chars
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
COHERE_API_KEY=optional-for-ai-summaries
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Health Checks
- `GET http://localhost:5000/health` – Server running?
- `GET http://localhost:5000/ready` – DB connected?
- Used by deployment systems and status dashboards

### Database Connection
- Mongoose connects *before* routes are imported in `server.js`
- Connection events logged via Pino; graceful shutdown closes DB on SIGTERM
- Indexes auto-created on model boot (Product SKU, Order publicId, etc.)

### PDF Report Generation
Files involved:
- **Template**: `utils/pdfLayout.js` – PDFKit boilerplate with header, footer, helpers.table()
- **Data**: `services/reportBuilders.js` – Queries for monthly, daily, custom-range, customer, status, revenue reports
- **Scheduling**: `jobs/scheduledReports.js` – node-cron fires monthly report at 8 AM on 1st; generates PDF, logs audit trail, sends email
- **AI Summary**: `utils/aiSummary.js` – Optional Cohere API integration for exec summaries

**Adding New Report Type:**
1. Add query function in `reportBuilders.js` (e.g., `getCustomReport`)
2. Update `buildReportData()` switch case
3. Register route in `routes/reportRoutes.js` with query param
4. Frontend calls via `api.js` helpers

## 🔐 Authentication & Authorization

**Flow:**
1. Frontend sends credentials to `POST /api/auth/login`
2. Backend validates, issues JWT, returns token
3. Frontend stores in `localStorage.authToken` (key name is enforced)
4. Axios interceptor (`axiosInstance.js`) auto-attaches `Authorization: Bearer <token>` to all requests
5. Backend middleware `authMiddleware(roles)` decodes JWT, checks role

**Role-Based Examples:**
- `verifyAdmin` – Only role=`"admin"` can access `/api/reports`, `/api/orders/:id` (update)
- `verifyToken` – Any authenticated user can access `/api/cart`, `/api/products`
- Public routes – `/api/products` (list), `/api/orders/track/:publicId` (guest tracking)

## 🎯 Project-Specific Patterns

### Error Handling
- Global error handler in `middleware/errorHandler.js` catches all errors
- Returns `{ success: false, message, ... }` JSON
- 404 handler must come *before* error handler in `server.js`

### Logging (Pino)
- Structured JSON logging in production; pretty-printed in dev
- Sensitive fields auto-redacted (passwords, tokens, auth headers)
- Use `logger.info()`, `logger.warn()`, `logger.error()`, `logger.fatal()`
- Avoid `console.log()`; use logger instead

### File Uploads
- Multer configured in `middleware/uploadMiddleware.js`
- Files uploaded to `uploads/` directory, served via `express.static("/uploads")`
- Product images, customization files stored here

### Rate Limiting
- `express-rate-limit` configured in middleware
- 15 requests per 15 minutes per IP (configurable)
- Applied to auth routes to prevent brute-force

### Validation
- `express-validator` for request body/query validation
- Chained in route handlers: `body('email').isEmail().normalizeEmail()`
- Errors collected via `validationResult(req)`

### Email (Nodemailer)
- `utils/sendReportEmail.js` – Attaches PDF reports, sends via SMTP
- `utils/emailTemplate.js` – OTP, welcome, order notification templates
- Async; doesn't block responses

### Frontend Context & State
- `CartContext` – Manages cart state, auto-fetches on mount, syncs with backend
- `WishlistContext` – Manages wishlist (localStorage + optional backend sync)
- Both provide hooks (`useCart()`, `useWishlist()`) for components

### Frontend Routing
- React Router v7 with nested routes (admin vs. public pages)
- Protected routes checked at component level (redirect to `/login` if no token)

## 📍 Key Files & Directories

| Path | Purpose |
|------|---------|
| `impressa-backend/server.js` | Express app, route registration, MongoDB connection |
| `impressa-backend/config/logger.js` | Pino logger config (redaction, levels) |
| `impressa-backend/middleware/authMiddleware.js` | JWT verification, role checks |
| `impressa-backend/controllers/` | Business logic per domain (auth, order, product, etc.) |
| `impressa-backend/models/` | Mongoose schemas (User, Order, Product, Coupon, Category) |
| `impressa-backend/services/reportBuilders.js` | Report data aggregation logic |
| `impressa-backend/utils/pdfLayout.js` | PDFKit template with reusable helpers |
| `impressa-backend/jobs/scheduledReports.js` | node-cron scheduled tasks (monthly email) |
| `impressa-frontend/src/utils/axiosInstance.js` | Axios config with auto-JWT injection |
| `impressa-frontend/src/context/CartContext.jsx` | Cart state management |
| `impressa-frontend/src/services/api.js` | API client wrapper (cart, order, payment helpers) |
| `PDF_TEMPLATES_README.md` | PDF design system documentation |
| `WOOCOMMERCE_INTEGRATION_PLAN.md` | Full roadmap (phases, sprints) |

## 🚀 Common Tasks

### Add a New Report Type
1. Implement query in `services/reportBuilders.js`
2. Register in `buildReportData()` switch
3. Define route in `routes/reportRoutes.js` with `verifyAdmin`
4. Frontend calls via `api.js` and displays in `pages/AdminReports.jsx`

### Add a New Model & Routes
1. Create schema in `models/NewModel.js` (use Mongoose conventions)
2. Create controller in `controllers/newController.js`
3. Create router in `routes/newRoutes.js` (mount in `server.js`)
4. Add CRUD helpers in `services/` if complex logic
5. Test with Postman or API client (include auth header)

### Update Frontend Form Data
1. Submit form via `api.js` helper
2. Catch errors, display toast/alert
3. Update Context state on success
4. Components auto-re-render via hook dependency

## ⚡ Performance Notes

- **PDF Generation**: Server-side PDFKit is fast; client-side PDF opens in new tab (user downloads or prints)
- **Report Caching**: Reports not cached; each request re-queries DB (suitable for admin use)
- **Cart Updates**: Sync to backend immediately (no optimistic updates); frontend reflects server state
- **Database Indexes**: Ensure indexes on frequently queried fields (publicId, email, createdAt, SKU)

## 📚 External Dependencies

**Backend Key Libraries:**
- `express`, `mongoose` – Core framework & ORM
- `jsonwebtoken`, `bcryptjs` – Auth
- `pdfkit`, `nodemailer` – Report generation, email
- `node-cron` – Scheduled tasks
- `pino`, `pino-http` – Structured logging
- `express-rate-limit`, `helmet` – Security

**Frontend Key Libraries:**
- `react`, `react-router-dom` – UI framework & routing
- `axios` – HTTP client
- `tailwindcss` – CSS framework
- `chart.js`, `react-chartjs-2` – Dashboard charts

## 🔍 Testing & Debugging

- **Backend tests**: Currently empty (`test` script fails); unit tests for models/services needed (Phase 4)
- **Frontend tests**: React Testing Library configured but minimal coverage
- **Debug mode**: Set `NODE_ENV=development` for verbose logging and pretty-printed JSON
- **Health endpoints**: Use `/health` and `/ready` to verify server state

## 📊 Project Status

**Current Phase:** Phase 2 - Core E-commerce Features  
**Completed:** Phase 1 (Auth, Security, Logging, Health Checks)  
**In Progress:** Enhanced data models (Product variations, Categories, Coupons)  
**Next:** Payment integration (MTN MoMo), Full e-commerce checkout, Admin dashboard analytics  

See `WOOCOMMERCE_INTEGRATION_PLAN.md` and `NEXT_STEPS.md` for detailed roadmap.

---

**Last Updated:** November 11, 2025  
**Questions?** Review `README.md`, `PDF_TEMPLATES_README.md`, or examine route handlers & models.

# WooCommerce Integration - Prioritized Action Plan

**Project:** Impressa E-commerce Platform  
**Goal:** Achieve WooCommerce-level functionality for a complete online store  
**Timeline:** 12-16 weeks (3-4 sprints of 4 weeks each)

---

## 🎯 Phase 1: Critical Foundations (Weeks 1-4)
**Goal:** Secure the platform and establish production-ready infrastructure

### Sprint 1.1: Security & Configuration (Week 1-2)
**Priority:** CRITICAL - Required before production

#### Tasks:
1. **Environment Configuration** ⚡ URGENT
   - [ ] Create `.env.example` with all required variables
   - [ ] Add MONGO_URI, JWT_SECRET, PORT, NODE_ENV
   - [ ] Add email config (SMTP_HOST, SMTP_PORT, EMAIL_FROM)
   - [ ] Validate env vars with `dotenv` + custom validation
   - [ ] Document setup in README.md

2. **Security Middleware**
   - [ ] Install & configure `helmet` for HTTP headers security
   - [ ] Strict CORS policy (whitelist frontend domains)
   - [ ] Rate limiting on all public routes (express-rate-limit already installed)
   - [ ] Input validation with `express-validator` or `zod`
   - [ ] Add express error handler middleware with consistent JSON format

3. **Authentication Hardening**
   - [ ] Password strength requirements
   - [ ] JWT refresh token strategy
   - [ ] Secure password reset flow with expiring tokens
   - [ ] Email verification for new accounts

**Dependencies to Install:**
```bash
npm install helmet express-validator zod
```

**Files to Modify:**
- `server.js` - Add helmet, error handler, CORS config
- `.env.example` - Create template
- `routes/authRoutes.js` - Add validation middleware

---

### Sprint 1.2: Data Model Extensions (Week 2-3)
**Priority:** HIGH - Needed for catalog and checkout

#### Tasks:
4. **Enhanced Product Model**
   - [ ] Add `sku` field (unique, indexed, searchable)
   - [ ] Add `barcode` field
   - [ ] Add `categories` (array of ObjectId refs to Category model)
   - [ ] Add `attributes` array (e.g., size, color with values)
   - [ ] Add `variations` subdocument (SKU, attributes, price, stock per variant)
   - [ ] Add `visibility` enum (public, hidden, draft)
   - [ ] Ensure `images` array is fully functional (already exists)
   - [ ] Add `weight` and `dimensions` for shipping calculation

5. **Create Category Model**
   - [ ] New model: `models/Category.js`
   - [ ] Fields: name, slug, parent (for hierarchy), description, image
   - [ ] Tree structure support for nested categories

6. **Enhanced Order Model**
   - [ ] Add `items` array (support multiple products per order)
   - [ ] Add `billingAddress` and `shippingAddress` subdocuments
   - [ ] Add `totals` object: { subtotal, shipping, tax, discount, grandTotal }
   - [ ] Add `payment` object: { method, status, transactionId, paidAt }
   - [ ] Add `shipping` object: { method, cost, trackingNumber, carrier }
   - [ ] Add `notes` array: [{ text, author, isCustomerVisible, createdAt }]
   - [ ] Add `couponCode` and `discountAmount`

7. **Create Coupon Model**
   - [ ] New model: `models/Coupon.js`
   - [ ] Types: fixed, percentage, free_shipping
   - [ ] Fields: code, type, value, minSpend, maxSpend, usageLimit, expiresAt
   - [ ] Usage tracking

**New Files to Create:**
- `models/Category.js`
- `models/Coupon.js`
- `models/ShippingZone.js` (prepare for Phase 2)

**Files to Modify:**
- `models/Product.js` - Extend schema
- `models/Order.js` - Major refactor for multi-item orders

---

### Sprint 1.3: Logging & Monitoring (Week 3-4)
**Priority:** MEDIUM - Good for debugging

#### Tasks:
8. **Structured Logging**
   - [ ] Install `pino` and `pino-http`
   - [ ] Replace console.log with structured logging
   - [ ] Log levels: error, warn, info, debug
   - [ ] Request/response logging middleware

9. **Health Checks**
   - [ ] `/health` endpoint (basic status)
   - [ ] `/ready` endpoint (check DB connection)
   - [ ] Graceful shutdown handler

**Dependencies to Install:**
```bash
npm install pino pino-http pino-pretty
```

---

## 🛒 Phase 2: Core E-commerce Features (Weeks 5-8)
**Goal:** Enable complete purchase flow with payments and shipping

### Sprint 2.1: Cart & Checkout Enhancement (Week 5-6)

#### Tasks:
10. **Server-Side Cart (Optional but Recommended)**
    - [ ] Create `models/Cart.js` with session token
    - [ ] Cart endpoints: GET, POST, PATCH, DELETE
    - [ ] Merge cart on login (localStorage → server)
    - [ ] Cart expiration (7 days)

11. **Enhanced Checkout Flow**
    - [ ] Multi-step checkout API
    - [ ] Address validation (regex patterns per country)
    - [ ] Shipping method selection
    - [ ] Tax calculation integration point
    - [ ] Order summary with all totals

12. **Coupon System**
    - [ ] Create `routes/couponRoutes.js`
    - [ ] Apply/validate coupon on cart
    - [ ] Admin CRUD for coupons
    - [ ] Usage limit enforcement

**Files to Create:**
- `models/Cart.js`
- `routes/cartRoutes.js`
- `routes/couponRoutes.js`
- `controllers/cartController.js`
- `controllers/couponController.js`

---

### Sprint 2.2: Payment Integration (Week 6-7)
**Priority:** CRITICAL - Revenue-blocking

#### Tasks:
13. **Stripe Integration**
    - [ ] Install `stripe` SDK
    - [ ] Create payment intent on checkout
    - [ ] Webhook handler for payment events
    - [ ] Update order status on successful payment
    - [ ] Handle failed/refunded payments
    - [ ] Save payment methods for returning customers

14. **PayPal Integration**
    - [ ] Install `@paypal/checkout-server-sdk`
    - [ ] PayPal order creation
    - [ ] Capture payment on approval
    - [ ] Webhook for PayPal events

15. **Mobile Money (Rwanda)**
    - [ ] Research MTN MoMo API
    - [ ] Research Airtel Money API
    - [ ] Implement payment initiation
    - [ ] Webhook/callback handling
    - [ ] Status polling if no webhooks

**Dependencies to Install:**
```bash
npm install stripe @paypal/checkout-server-sdk
```

**Files to Create:**
- `services/paymentService.js`
- `routes/paymentRoutes.js`
- `controllers/webhookController.js`

**Environment Variables to Add:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`

---

### Sprint 2.3: Shipping & Taxes (Week 7-8)

#### Tasks:
16. **Shipping Zones & Methods**
    - [ ] Create `models/ShippingZone.js` and `models/ShippingMethod.js`
    - [ ] Admin UI to create zones (by country/region)
    - [ ] Flat rate, free shipping, local pickup methods
    - [ ] Calculate shipping cost on checkout

17. **Carrier Integration (Optional Advanced)**
    - [ ] Integrate DHL/UPS API for rate quotes
    - [ ] Weight-based calculation
    - [ ] International shipping support

18. **Tax System**
    - [ ] Create `models/TaxRate.js`
    - [ ] Tax classes (standard, reduced, zero-rate)
    - [ ] Tax calculation service (by region)
    - [ ] Optional: TaxJar/Avalara integration for automation

**Files to Create:**
- `models/ShippingZone.js`
- `models/ShippingMethod.js`
- `models/TaxRate.js`
- `services/shippingService.js`
- `services/taxService.js`

---

## 📦 Phase 3: Catalog & Customer Experience (Weeks 9-12)
**Goal:** Rich product catalog and customer self-service

### Sprint 3.1: Advanced Catalog (Week 9-10)

#### Tasks:
19. **Categories Implementation**
    - [ ] Create `routes/categoryRoutes.js`
    - [ ] Category CRUD endpoints
    - [ ] Assign products to categories
    - [ ] Category tree view (nested)
    - [ ] Filter products by category

20. **Product Variations**
    - [ ] Variation matrix UI (admin)
    - [ ] Generate variations from attributes
    - [ ] Individual pricing/stock per variation
    - [ ] Frontend variant selector

21. **Product Search & Filters**
    - [ ] Full-text search (MongoDB text index on name/description)
    - [ ] Filter by category, price range, attributes
    - [ ] Sort by price, popularity, date

22. **Reviews & Ratings**
    - [ ] Create `models/Review.js`
    - [ ] Review submission (verified purchases only)
    - [ ] Star rating (1-5)
    - [ ] Admin moderation queue
    - [ ] Display average rating on product

**Files to Create:**
- `routes/categoryRoutes.js`
- `models/Review.js`
- `routes/reviewRoutes.js`

---

### Sprint 3.2: Customer Accounts (Week 10-11)

#### Tasks:
23. **My Account Area**
    - [ ] Order history endpoint with pagination
    - [ ] Order details view
    - [ ] Re-order functionality
    - [ ] Save multiple addresses
    - [ ] Profile update (name, email, phone)

24. **Password Management**
    - [ ] Forgot password flow (email token)
    - [ ] Reset password endpoint
    - [ ] Change password (authenticated)

25. **Email Verification**
    - [ ] Send verification email on signup
    - [ ] Verify token endpoint
    - [ ] Resend verification email

**Files to Modify:**
- `routes/authRoutes.js` - Add password reset, email verification
- Create `routes/accountRoutes.js` for customer profile

---

### Sprint 3.3: Inventory Management (Week 11-12)

#### Tasks:
26. **Stock Management**
    - [ ] Stock deduction on successful order
    - [ ] Stock restoration on cancellation/refund
    - [ ] Backorder flag (allow/disallow)
    - [ ] Low-stock threshold alerts

27. **Bulk Operations**
    - [ ] Bulk product update endpoint
    - [ ] CSV import for products (with `csv-parser`)
    - [ ] CSV export for products
    - [ ] Bulk stock update

**Dependencies to Install:**
```bash
npm install csv-parser papaparse
```

---

## 📊 Phase 4: Analytics & Operations (Weeks 13-16)
**Goal:** Business intelligence and operational efficiency

### Sprint 4.1: Email & Notifications (Week 13)

#### Tasks:
28. **Transactional Email Templates**
    - [ ] Switch from Gmail to SendGrid/Mailgun
    - [ ] Order confirmation email (Handlebars template)
    - [ ] Order status update emails (shipped, delivered)
    - [ ] Payment receipt email
    - [ ] Refund notification
    - [ ] Welcome email on signup

29. **Abandoned Cart Emails**
    - [ ] Cron job to detect abandoned carts (24h)
    - [ ] Send reminder email with cart link
    - [ ] Track email opens/clicks (optional)

**Dependencies to Install:**
```bash
npm install @sendgrid/mail
# OR
npm install mailgun-js
```

**Files to Create:**
- `templates/emails/` (Handlebars templates)
- `services/emailService.js`

---

### Sprint 4.2: Reporting & Analytics (Week 14-15)

#### Tasks:
30. **Enhanced Reports**
    - [ ] Sales by day/week/month endpoint
    - [ ] Revenue by product/category
    - [ ] Tax collected report
    - [ ] Shipping costs report
    - [ ] Coupon usage report

31. **Dashboard Widgets**
    - [ ] Total revenue (period)
    - [ ] Orders count by status
    - [ ] Top-selling products
    - [ ] Average order value (AOV)
    - [ ] Conversion rate (orders/visitors - requires tracking)

32. **Google Analytics & Meta Pixel**
    - [ ] Frontend integration (gtag.js)
    - [ ] Server-side events (GA4 Measurement Protocol)
    - [ ] Track: view_item, add_to_cart, begin_checkout, purchase

**Files to Modify:**
- Enhance `routes/analyticsRoutes.js`

---

### Sprint 4.3: API Documentation & Integrations (Week 15-16)

#### Tasks:
33. **REST API Documentation**
    - [ ] Install `swagger-jsdoc` and `swagger-ui-express`
    - [ ] Document all endpoints (OpenAPI 3.0)
    - [ ] Serve docs at `/api-docs`
    - [ ] Authentication flow docs

34. **Webhooks System**
    - [ ] Create `models/Webhook.js`
    - [ ] Admin UI to register webhook URLs
    - [ ] Events: order.created, order.updated, product.updated
    - [ ] Retry logic for failed webhooks

35. **API Keys for External Access**
    - [ ] Generate API keys with scopes
    - [ ] API key authentication middleware
    - [ ] Rate limiting per API key

**Dependencies to Install:**
```bash
npm install swagger-jsdoc swagger-ui-express
```

**Files to Create:**
- `docs/openapi.yaml` or inline JSDoc
- `models/Webhook.js`
- `services/webhookService.js`

---

## 🚀 Phase 5: Production Readiness (Week 16+)
**Goal:** Deploy with confidence

### Sprint 5.1: Testing & Quality

#### Tasks:
36. **Testing Setup**
    - [ ] Install `jest` and `supertest`
    - [ ] Unit tests for services (payment, shipping, tax)
    - [ ] Integration tests for routes
    - [ ] Test database seeding script

37. **Frontend Testing**
    - [ ] React Testing Library for components
    - [ ] E2E tests with Playwright/Cypress
    - [ ] Test: Add to cart → Checkout → Payment

**Dependencies to Install:**
```bash
npm install --save-dev jest supertest @testing-library/react @testing-library/jest-dom
```

---

### Sprint 5.2: DevOps & Performance

#### Tasks:
38. **Docker & Deployment**
    - [ ] Create `Dockerfile` for backend
    - [ ] `docker-compose.yml` for local stack (MongoDB, backend)
    - [ ] Environment-specific configs

39. **CI/CD Pipeline**
    - [ ] GitHub Actions workflow
    - [ ] Lint, test, build on PR
    - [ ] Deploy to staging on merge to `develop`
    - [ ] Deploy to production on merge to `main`

40. **Performance Optimization**
    - [ ] Add database indexes (publicId, SKU, createdAt)
    - [ ] Enable gzip compression (`compression` middleware)
    - [ ] Image optimization with `sharp`
    - [ ] CDN setup for uploads (Cloudflare/AWS CloudFront)
    - [ ] React code-splitting and lazy loading

**Dependencies to Install:**
```bash
npm install compression sharp
```

41. **Monitoring & Logging**
    - [ ] Set up error tracking (Sentry)
    - [ ] Application performance monitoring (New Relic/Datadog)
    - [ ] Uptime monitoring (UptimeRobot/Pingdom)

---

## 📋 Quick Reference Checklists

### Pre-Production Checklist ✅
- [ ] All environment variables documented in `.env.example`
- [ ] Helmet & CORS configured
- [ ] Rate limiting on public endpoints
- [ ] Input validation on all POST/PUT/PATCH routes
- [ ] Error handler middleware catches all errors
- [ ] Passwords hashed with bcrypt (already done)
- [ ] JWT secrets are strong and rotated
- [ ] Database indexes created
- [ ] Email delivery configured (SendGrid/Mailgun)
- [ ] Payment webhooks tested
- [ ] SSL/TLS certificate installed
- [ ] Backup strategy for MongoDB
- [ ] Logging configured (pino)
- [ ] Health check endpoints
- [ ] API documentation published

### Payment Integration Checklist 💳
- [ ] Stripe test mode working
- [ ] Stripe production keys configured
- [ ] Webhook signature verification
- [ ] PayPal sandbox tested
- [ ] Mobile money test accounts verified
- [ ] Refund flow implemented
- [ ] Payment failure handling
- [ ] Idempotency for payment requests

### SEO & Marketing Checklist 🎯
- [ ] Meta tags (title, description) per page
- [ ] Open Graph tags for social sharing
- [ ] JSON-LD structured data (Product, Organization)
- [ ] XML sitemap generation
- [ ] robots.txt configured
- [ ] Google Analytics 4 tracking
- [ ] Meta Pixel tracking
- [ ] Newsletter signup form
- [ ] Abandoned cart recovery

---

## 🔧 Technology Stack Summary

### Backend (Current + Additions)
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcrypt
- **Payments:** Stripe, PayPal, Mobile Money
- **Email:** Nodemailer → SendGrid/Mailgun
- **Validation:** express-validator / zod
- **Security:** helmet, cors, express-rate-limit
- **Logging:** pino + pino-http
- **PDF:** PDFKit (already installed)
- **File Upload:** multer (already installed)
- **Scheduling:** node-cron (already installed)
- **Testing:** Jest + Supertest
- **API Docs:** Swagger (OpenAPI 3.0)

### Frontend (Assumed React)
- **Framework:** React
- **State Management:** Context API / Redux
- **Forms:** React Hook Form
- **Payments:** Stripe Elements, PayPal JS SDK
- **Analytics:** GA4, Meta Pixel
- **Testing:** React Testing Library, Playwright

---

## 📈 Success Metrics

### Phase 1 (Foundation)
- ✅ Zero critical security vulnerabilities (npm audit)
- ✅ 100% environment variables documented
- ✅ Error handling covers all routes

### Phase 2 (E-commerce Core)
- ✅ Payment success rate > 95%
- ✅ Checkout completion rate > 60%
- ✅ Average checkout time < 3 minutes

### Phase 3 (Catalog & UX)
- ✅ Product search response time < 200ms
- ✅ Customer satisfaction (reviews) > 4.0/5
- ✅ Repeat customer rate > 20%

### Phase 4 (Analytics & Ops)
- ✅ Email delivery rate > 98%
- ✅ Report generation time < 5 seconds
- ✅ API documentation coverage 100%

### Phase 5 (Production)
- ✅ Uptime > 99.9%
- ✅ Average response time < 500ms
- ✅ Test coverage > 70%
- ✅ Zero unhandled errors in production

---

## 🎯 Immediate Next Steps (This Week)

1. **Fix MongoDB Connection** ⚡ URGENT
   - Create `.env` file with `MONGO_URI=mongodb://localhost:27017/impressa`
   - Or use MongoDB Atlas connection string

2. **Create .env.example**
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/impressa
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_EXPIRES_IN=7d
   
   # Email
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   EMAIL_FROM=noreply@impressa.com
   
   # Payments (add when implementing)
   STRIPE_SECRET_KEY=
   STRIPE_WEBHOOK_SECRET=
   PAYPAL_CLIENT_ID=
   PAYPAL_CLIENT_SECRET=
   ```

3. **Install Security Packages**
   ```bash
   npm install helmet express-validator
   ```

4. **Add Basic Security to server.js**
   - Import and use helmet
   - Add proper CORS configuration
   - Add global error handler

5. **Start Phase 1, Sprint 1.1** 🚀

---

## 📞 Support & Resources

- **Stripe Docs:** https://stripe.com/docs/api
- **PayPal Docs:** https://developer.paypal.com/
- **Express Best Practices:** https://expressjs.com/en/advanced/best-practice-security.html
- **MongoDB Performance:** https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/
- **WooCommerce REST API Reference:** https://woocommerce.github.io/woocommerce-rest-api-docs/

---

**Last Updated:** 2025-01-11  
**Status:** Planning Phase  
**Next Review:** After Phase 1 completion

# Impressa - MERN E-commerce Platform

## Overview
Impressa is a full-stack MERN (MongoDB, Express, React, Node.js) e-commerce application for customizable product orders with admin analytics, reporting, and payment integration.

**Last Updated:** November 17, 2025

## Project Architecture

### Structure
```
impressa/
├── impressa-backend/      # Node.js/Express API server
│   ├── controllers/       # Request handlers
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── middleware/       # Auth, validation, rate limiting
│   ├── services/         # Business logic (payments, reports)
│   ├── utils/            # Helpers (PDF, CSV, email)
│   └── server.js         # Entry point
├── impressa-frontend/    # React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   └── context/      # React context (cart, wishlist)
│   └── public/
└── start.sh             # Startup script
```

### Technology Stack
- **Frontend**: React 19, React Router, Chart.js, TailwindCSS
- **Backend**: Node.js, Express 5, MongoDB/Mongoose
- **Authentication**: JWT tokens
- **Payments**: MTN MoMo integration
- **Reports**: PDF (PDFKit) and CSV generation

## Replit Configuration

### Ports
- **Frontend**: Port 5000 (publicly accessible via Replit webview)
- **Backend**: Port 8000 (internal API server)

### Environment Variables

**Backend** (`impressa/impressa-backend/.env`):
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT authentication secret
- `PORT` - Backend server port (8000)
- `EMAIL_USER`, `EMAIL_PASS` - SMTP credentials
- `COHERE_API_KEY` - AI summary generation

**Frontend** (`impressa/impressa-frontend/.env`):
- `PORT` - Frontend port (5000)
- `REACT_APP_API_URL` - Backend API URL
- `DANGEROUSLY_DISABLE_HOST_CHECK` - Required for Replit proxy

### Workflow
Single workflow runs both backend and frontend via `start.sh`:
1. Starts backend on port 8000 (background)
2. Starts frontend on port 5000 (foreground)

## Features

### Customer Features
- Product browsing with categories
- Shopping cart with coupon support
- Checkout with shipping calculation
- MTN MoMo payment integration
- Order tracking
- User authentication

### Admin Features
- Product management (CRUD)
- Order management and status updates
- User management
- Analytics dashboard with charts
- Report generation (PDF/CSV)
- Scheduled email reports
- AI-powered insights

## API Endpoints

### Public Routes
- `GET /api/products` - List products
- `GET /api/categories` - List categories
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Protected Routes (Require Authentication)
- `GET /api/cart` - Get cart
- `POST /api/checkout/order` - Create order
- `GET /api/orders/user` - Get user orders
- `POST /api/payments/mtn/initiate` - Initiate payment

### Admin Routes
- `POST /api/products` - Create product
- `GET /api/dashboard/stats` - Dashboard analytics
- `GET /api/orders/report` - Generate reports
- `GET /api/analytics/*` - Analytics endpoints

## Database Schema

### Collections
- `users` - User accounts (customer/admin)
- `products` - Product catalog
- `categories` - Product categories
- `orders` - Customer orders
- `carts` - Shopping carts
- `coupons` - Discount coupons
- `customizations` - Product customizations
- `reportlogs` - Report generation logs

## Recent Changes
- **Nov 17, 2025**: Initial Replit setup
  - Configured for Replit environment
  - Updated ports (frontend: 5000, backend: 8000)
  - Configured CORS for all origins
  - Updated frontend to use environment-based API URL
  - Created startup script for both servers

## User Preferences
- Database: MongoDB Atlas (provided)
- Email service: Gmail SMTP

## Development Notes

### Running Locally
The application auto-starts via the workflow. To manually restart:
```bash
bash start.sh
```

### Database Connection
Uses MongoDB Atlas cluster at `smartbiz.g351flo.mongodb.net`

### Known Issues
- Minor ESLint warnings in frontend (unused variables)
- Mongoose duplicate index warning (non-critical)

## Next Steps / TODOs
- Configure deployment for production
- Test MTN MoMo payment integration
- Add product images/uploads directory
- Test all admin features
- Review and fix ESLint warnings if needed

## Support
For issues or questions about this setup, refer to:
- Main README: `README.md`
- Report documentation: `PDF_TEMPLATES_README.md`
- Integration guide: `MTN_MOMO_INTEGRATION.md`

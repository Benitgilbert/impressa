🧠 impressa Backend
impressa is a secure, scalable e-commerce backend built with Node.js, Express, and MongoDB, designed to power business-grade platforms with advanced reporting, role-based access, and customizable product workflows. It supports guest checkout, dynamic analytics, and enterprise-grade features tailored for real-world impact and operational intelligence.

🚀 Key Features
- 🔐 JWT Authentication with secure password hashing and refresh token support
- 🧑‍💼 Role-Based Access Control for admin, cashier, inventory, delivery, and customer roles
- 🛒 Product Management with customizable inputs: text, file uploads, and cloud links
- 📦 Order System with placement, status tracking, and delivery logic
- 📊 Analytics Endpoints for business insights: top products, customization usage, status breakdown
- 🧾 Monthly PDF Reports with dynamic admin signature, stamp, and AI-generated summaries
- 🧠 AI Summary Engine for human-readable insights per report
- 📁 Report Logs with filters, pagination, CSV export, and audit trail tracking
- 📬 Email Notifications for report generation and OTP-based admin login
- 🧪 Protected Routes with middleware enforcement and rate limiting
- 📅 Scheduled Reports auto-generated monthly via cron jobs
- 🌍 Deployment Ready for platforms like Render, Railway, or VPS

🧱 Tech Stack
| Layer           | Tools & Libraries                      |
|-----------------|----------------------------------------|
| Backend         | Node.js, Express                       |
| Database        | MongoDB, Mongoose                      |
| Authentication  | JWT, bcrypt                            |
| Reporting       | PDFKit, CSV Exporters                  |
| Email           | Nodemailer                             |
| Scheduling      | node-cron                              |
| Security        | express-rate-limit, OTP-based 2FA      |
| Dev Tools       | Nodemon, dotenv                        |
| Version Control | Git & GitHub                           |





## 📦 Installation

```bash
git clone https://github.com/Benitgilbert/impressa-backend.git
cd impressa-backend
npm install
npm run dev




impressa-backend/
├── controllers/         # Auth & order logic
│   ├── authController.js
│   └── orderController.js
├── middleware/          # Auth & rate limiting
│   └── authMiddleware.js
├── models/              # Mongoose schemas
│   ├── User.js
│   ├── Order.js
│   └── ReportLog.js
├── routes/              # API endpoints
│   ├── authRoutes.js
│   └── orderRoutes.js
├── services/            # Report builders
│   └── reportBuilders.js
├── utils/               # PDF, CSV, email, AI summary
│   ├── reportGenerator.js
│   ├── csvExporter.js
│   ├── logCsvExporter.js
│   ├── aiSummary.js
│   └── emailSender.js
├── jobs/                # Scheduled tasks
│   └── scheduledReports.js
├── assets/              # Branding assets
│   └── logo.png
├── server.js            # Entry point
└── .env                 # Environment variables     


🔐 Environment Variables
Create a .env file with:
JWT_SECRET=your_access_token_secret
REFRESH_SECRET=your_refresh_token_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
MONGO_URI=mongodb+srv://your_cluster.mongodb.net/impressa



🧑‍💻 Author
Benit Gilbert
Bachelor’s in Software Engineering — Rwanda
Focused on backend mastery, business logic, and scalable architecture for real-world platforms.

📌 Roadmap
- [x] User authentication & role management
- [x] Product model & CRUD routes
- [x] Order system with delivery tracking
- [x] Analytics dashboard
- [x] Monthly PDF report generation
- [x] Admin profile settings (title, signature, stamp)
- [x] CSV export for orders
- [x] Report history logging
- [x] 2FA admin login with OTP
- [x] Email notifications
- [x] Scheduled monthly reports
- [x] Audit trail for report views/downloads
- [ ] CI/CD integration
- [ ] Frontend dashboard (next phase)

📜 License
This project is open-source and available under the MIT License.

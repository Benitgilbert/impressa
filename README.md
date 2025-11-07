# Impressa (MERN) Monorepo

Full‑stack MERN app for customizable product orders with admin analytics,reporting and other features. This repo contains both apps:
- impressa/impressa-frontend: React admin + dashboards
- impressa/impressa-backend: Node/Express API + reporting

## Prerequisites
- Node.js 18+
- Git
- MongoDB instance (local or Atlas)

## Getting started
1) Clone and enter the repo
```
git clone https://github.com/Benitgilbert/impressa.git
cd impressa
```

2) Install deps
```
# Backend
cd impressa/impressa-backend
npm install

# Frontend (new shell or after backend)
cd ../impressa-frontend
npm install
```

3) Run locally
```
# Backend
cd impressa/impressa-backend
npm run dev

# Frontend
cd ../impressa-frontend
npm start
```

## Reports (PDF/CSV)
- Unified server-side PDF template in impressa/impressa-backend/utils/pdfLayout.js
- Endpoints:
  - GET /api/orders/report?type=monthly|daily|custom-range|customer|status|revenue&format=pdf|csv
  - GET /api/reports/generate?type=users&format=pdf|csv
- Frontend Reports page (Admin > Reports) calls /api/orders/report and opens PDFs in a new tab
- Monthly scheduled PDF written to reports/ and emailed to admin
- Optional logo: assets/logo.png

See PDF_TEMPLATES_README.md for design and REPORT_TROUBLESHOOTING.md for common issues.

## Structure
```
impressa/
  ├─ impressa-frontend/
  │   └─ src/... (AdminReports.jsx, axios baseURL, components)
  ├─ impressa-backend/
  │   ├─ controllers/, routes/, models/, services/
  │   ├─ utils/ (pdfLayout.js, csvExporter.js, logCsvExporter.js, aiSummary.js, sendReportEmail.js)
  │   ├─ jobs/scheduledReports.js
  │   └─ assets/logo.png
  ├─ PDF_TEMPLATES_README.md
  ├─ REPORT_TROUBLESHOOTING.md
  └─ README.md
```

## Contributing
- Branch from main, commit with clear messages, open PR.

## License
Proprietary to Impressa Custom Solutions. All rights reserved.


Impressa Monorepo
==================

A full-stack project organized as a monorepo with separate frontend and backend apps under the `impressa-frontend` and `impressa-backend` directories.

Contents
--------
- `impressa-frontend`: Web UI (Node.js based; contains a `package.json`).
- `impressa-backend`: Server-side service/APIs (Node.js based; contains a `package.json`).

Prerequisites
-------------
- Node.js 18+ and npm (or yarn/pnpm)
- Git

Getting Started
---------------
1) Clone the repository:

```
git clone https://github.com/Benitgilbert/impressa.git
cd impressa
```

2) Install dependencies:

```
# Frontend
cd impressa-frontend
npm install

# Backend (in a separate shell or after the frontend finishes)
cd ../impressa-backend
npm install
```

3) Run locally:

```
# Frontend
cd impressa-frontend
npm run dev

# Backend
cd ../impressa-backend
npm run dev
```

Project Scripts (Typical)
-------------------------
These scripts may vary; check each `package.json`.

- Frontend
  - `npm run dev`: Start development server
  - `npm run build`: Create production build
  - `npm start`: Serve production build

- Backend
  - `npm run dev`: Start backend in watch mode
  - `npm run build`: Compile/build backend
  - `npm start`: Run backend in production

Environment Variables
---------------------
Create `.env` files in each app as needed (not committed). Examples:

```
impressa-frontend/.env
impressa-backend/.env
```

Monorepo Structure
------------------
```
impressa/
  ├─ impressa-frontend/
  │   ├─ package.json
  │   └─ ...
  ├─ impressa-backend/
  │   ├─ package.json
  │   └─ ...
  ├─ .gitignore
  └─ README.md
```

Contributing
------------
1) Create a feature branch from `main`.
2) Make your changes.
3) Commit with clear messages and open a PR.

License
-------
This project is proprietary to its owner. All rights reserved.




# Loan Manager

Loan Manager is a desktop-first loan management system built with React, Express, Prisma and SQLite. The main product today is the local Windows desktop app packaged with Electron. Web mode remains useful for development and local QA.

## Current desktop beta scope

- Client management with `RUT`, phone, email and address
- Loan creation with fixed or simple schedules
- Payment registration with partial payments and transaction history
- Collections dashboard with alerts and upcoming due dates
- Excel export and import flows
- Legal document generation for `Pagare` and `Mutuo`
- Local packaged backend with SQLite in `AppData`
- Prisma migrations applied at desktop startup

## Legal documents

The desktop app now fills legal documents from the client record.

- `Pagare`: generated from `public/templates/pagare_template_sc.docx`
- `Mutuo`: generated from `public/templates/mutuo_template_sc.doc`
- Autofill fields: client name, `RUT`, address, loan amount and schedule-derived values

Because of this flow, `RUT` is now a first-class field in client creation, editing, search and import.

## Tech stack

### Frontend
- React 19
- Vite 7
- React Router 7 with `HashRouter` for Electron
- Tailwind CSS 4
- TanStack Query
- Recharts

### Backend
- Express 5
- Prisma 5
- SQLite
- JWT auth
- Zod validation

### Desktop
- Electron 33
- electron-builder

## Local development

### Prerequisites
- Node.js 18+
- npm 9+

### Install

```bash
npm install
cd server
npm install
```

### Configure backend

Create `server/.env` from `server/.env.example` and set a strong `JWT_SECRET`.

Example:

```env
JWT_SECRET=your-secret-key-minimum-32-characters-here
DATABASE_URL="file:./dev.db"
PORT=3011
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173,app://localhost
```

### Initialize database

```bash
cd server
npx prisma migrate dev --name init
node create-user.js
```

### Start web development mode

```bash
npm run start
```

Frontend runs on `http://localhost:5173`.
Backend runs on `http://127.0.0.1:3011`.

## Desktop build

```bash
npm run electron:build
```

Installer output:

- `release/LoanManager-Setup-1.0.0.exe`

Useful desktop notes:

- The packaged backend runs from `resources/server/`
- SQLite is copied to the Windows user data folder
- Desktop startup runs `prisma migrate deploy`
- If packaged migrations fail, the app now stops instead of launching against an outdated schema

## API highlights

Notable endpoints used by the desktop app:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/clients`
  - supports pagination
  - supports `search`
- `POST /api/clients`
- `GET /api/clients/:id`
- `PUT /api/clients/:id`
- `GET /api/loans`
- `POST /api/loans`
- `GET /api/loans/:id`
- `POST /api/payments/:id/transactions`
- `GET /api/dashboard/stats`
- `GET /api/dashboard/alerts`
- `GET /api/dashboard/projections`
- `GET /api/reports/export-all`
- `POST /api/import`
- `GET /api/health`

## Quality checks

Current local verification flow:

```bash
npm run lint
npx vitest run
cd server && npm test
npm run build
graphify update .
```

## Graphify

Graphify is part of the standard workflow for this repo.

- Report output: `graphify-out/GRAPH_REPORT.md`
- Team workflow: `docs/GRAPHIFY.md`

Use it before closing meaningful changes:

```bash
graphify update .
graphify query "What connects document generation to the desktop app?"
graphify explain useLoans
```

## Planning docs

- Desktop deployment status: `docs/PLAN-github-deployment.md`
- Android planning track: `docs/PLAN-android-app.md`
- Graphify workflow: `docs/GRAPHIFY.md`

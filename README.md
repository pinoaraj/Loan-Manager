# Loan Manager

Loan Manager is a desktop-first loan management system built with React, Express, Prisma and SQLite. The main product today is the local Windows desktop app packaged with Electron. Web mode remains useful for development and local QA.

## Current desktop beta scope

- Client management with `RUT`, phone, email and address
- Loan creation can start from the client detail view with the client preselected
- Loan creation with fixed or simple schedules
- Payment registration with partial payments and transaction history
- Payment alerts can deep-link into a specific installment and the payment modal closes cleanly on first click
- Collections dashboard with alerts and upcoming due dates
- User-facing views now hide internal loan codes and use consistent currency formatting across dashboard, collections, clients, loan detail and calculator flows
- Excel export and import flows
- Legal document generation for `Pagare` and `Mutuo`
- Local packaged backend with SQLite in `AppData`
- Prisma migrations applied at desktop startup

## Legal documents

The desktop app now fills legal documents from the client record.

- Documents can be opened from loan detail and from client detail; when a client has multiple loans, the app lets you choose which loan to use.
- Loan detail also exposes direct exports for `Contrato PDF`, `Word` and `Calendario`.
- Alerts and upcoming-payment views now deep-link to the specific pending `paymentId` inside the loan detail flow.
- `Pagare`: generated from `public/templates/pagare_template_sc.docx`
- `Mutuo`: generated directly from the active loan data as a `.docx` document
- Autofill fields: client name, `RUT`, address, loan amount and schedule-derived values
- Desktop builds resolve the `Pagare` template from the packaged `dist/templates/` assets so the same flow works in development and in the installed app.
- Desktop PDF exports use direct blob downloads for better Electron compatibility.

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
- App icon assets live in `build/icons/`; `app-icon.png` and `app-icon.ico` are the packaged sources and `app-icon.svg` is kept aligned for repo/documentation use

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
npm run electron:build
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

## Beta readiness

Current recommendation: ready for a controlled Windows beta.

- Green checks: lint, frontend tests, backend integration tests, web build, desktop installer build
- Validated areas: login, dashboard, clients, loan detail, partial payments, collections deep-links, document generation, import/export, packaged startup
- Residual risks to keep watching: legal document formatting with real customer data, packaged-app smoke testing on more than one Windows machine, and bundle size/performance around PDF/XLSX tooling

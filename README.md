# 💰 Loan Manager

A full-stack **loan management system** built with React + Express + Prisma. Manage clients, create loans with flexible payment schedules, track collections, and generate PDF/Word documents — all from a modern, responsive UI.

> **Desktop & Web** — Runs as a local web app or as an Electron desktop application on Windows.

> **Current Priority** — The main product is the local Windows desktop app. Android remains planned, but secondary.

---

## ✨ Features

| Area | Details |
|------|---------|
| **Dashboard** | Real-time portfolio overview, monthly cash-flow projections, loan health indicators |
| **Client Management** | CRUD operations, search & filter, detailed client profiles with loan history |
| **Loan Creation** | Fixed-rate amortization, configurable frequency (weekly / bi-weekly / monthly), grace days, late fees |
| **Payment Tracking** | Record full or partial payments, automatic overdue detection, transaction history |
| **Collections** | Calendar view of upcoming and overdue payments, quick-action collection workflow |
| **Calculator** | Standalone amortization calculator with exportable schedules |
| **Document Generation** | PDF payment schedules, Word (DOCX) promissory notes (*pagarés*) |
| **Data Import** | Bulk import clients and loans from CSV/Excel files |
| **Authentication** | JWT-based auth with bcrypt password hashing, rate-limited login |
| **Dark / Light Theme** | System-aware theme toggle with smooth transitions |
| **Desktop App** | Electron wrapper for local Windows use with packaged backend, SQLite in AppData and Prisma migrations on startup |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + Vite 7
- **Tailwind CSS 4** — utility-first styling
- **React Router 7** — client-side routing (HashRouter for Electron compatibility)
- **Recharts** — dashboard charts
- **Lucide React** — icon library
- **Sonner** — toast notifications
- **jsPDF / docx** — client-side document generation

### Backend
- **Express 5** — REST API
- **Prisma 5** — ORM with SQLite
- **JWT** — stateless authentication
- **Zod** — request validation
- **Helmet + CORS + Rate Limiting** — security middleware
- **Winston** — structured logging

### Desktop
- **Electron 33** — native Windows app wrapper
- **electron-builder** — packaging and distribution

### Project Mapping
- **Graphify** — local architecture graph and report generation

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/LoanManager.git
cd LoanManager
```

### 2. Install dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### 3. Configure environment

```bash
# From the server/ directory
cp .env.example .env
```

Edit `server/.env` and set a strong `JWT_SECRET`:

```env
JWT_SECRET=your-secret-key-minimum-32-characters-here
DATABASE_URL="file:./dev.db"
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,app://localhost
```

### 4. Initialize the database

```bash
cd server
npx prisma migrate dev --name init
```

### 5. Create the first admin user

```bash
cd server
node create-user.js
```

### 6. Start the development servers

```bash
# From the project root
npm run start
```

This starts both the Express backend (port 3001) and the Vite dev server (port 5173).

Open **http://localhost:5173** in your browser.

---

## 🖥️ Desktop App (Electron)

```bash
# Development mode (hot-reload)
npm run electron:dev

# Build Windows executable
npm run electron:build

# Build unpacked desktop app for verification
npm run rebuild-desktop
```

The packaged app will be output to the `release/` directory.

### Desktop Packaging Notes
- The packaged backend runs from `resources/server/`.
- SQLite is relocated to the Windows user data folder (`AppData`) at runtime.
- Electron runs `prisma migrate deploy` before starting the packaged backend.
- The desktop package includes Prisma CLI, engines and backend runtime dependencies.

---

## Graphify

The repo includes a local project graph in `graphify-out/`.

Detailed team workflow: [`docs/GRAPHIFY.md`](docs/GRAPHIFY.md)

Useful commands:

```bash
# Refresh code graph after local changes
graphify update .

# Rebuild graph automatically while coding
graphify watch .

# Ask questions about the current graph
graphify query "What connects the desktop app to Prisma?"

# Re-cluster an existing graph/report
graphify cluster-only .
```

---

## 📁 Project Structure

```
LoanManager/
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   │   ├── dashboard/      # Dashboard-specific widgets
│   │   └── ui/             # Base UI primitives
│   ├── context/            # React context providers
│   │   ├── AuthContext      # Authentication state
│   │   ├── LoanContext      # Loan data & API calls
│   │   └── ThemeContext     # Dark/light theme
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Route-level page components
│   ├── utils/              # Helpers (amortization, PDF, etc.)
│   ├── App.jsx             # Root component & routing
│   └── main.jsx            # Entry point
├── server/                 # Express backend
│   ├── routes/             # API route handlers
│   ├── middleware/          # Auth, validation, rate limiting
│   ├── prisma/             # Schema & migrations
│   ├── utils/              # Logger
│   └── index.js            # Server entry point
├── desktop/                # Electron main process
│   └── main.cjs
├── docs/                   # Planning documents
├── public/                 # Static assets
└── package.json
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticate user |
| `POST` | `/api/auth/register` | Create new user |
| `GET` | `/api/clients` | List all clients |
| `POST` | `/api/clients` | Create a client |
| `GET` | `/api/clients/:id` | Get client detail |
| `PUT` | `/api/clients/:id` | Update client |
| `DELETE` | `/api/clients/:id` | Delete client |
| `GET` | `/api/loans` | List all loans |
| `POST` | `/api/loans` | Create a loan (with amortization schedule) |
| `GET` | `/api/loans/:id` | Get loan detail with payments |
| `PATCH` | `/api/loans/:id` | Update loan status |
| `POST` | `/api/payments/:id/transactions` | Record a payment transaction / partial payment |
| `GET` | `/api/dashboard` | Dashboard analytics |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/ai/risk-analysis` | Base AI risk analysis endpoint |

---

## 🔒 Security

- Passwords hashed with **bcrypt**
- JWT tokens with configurable expiry
- Helmet HTTP security headers
- CORS origin whitelist
- Rate limiting on auth endpoints (5 login attempts / 15 min)
- Request body size limits (10 MB)
- Input validation via Zod schemas

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/), [React](https://react.dev/), [Prisma](https://www.prisma.io/)
- Icons by [Lucide](https://lucide.dev/)
- Charts by [Recharts](https://recharts.org/)

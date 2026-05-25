# Graph Report - LoanManager  (2026-05-25)

## Corpus Check
- 95 files · ~1,339,755 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 287 nodes · 330 edges · 35 communities detected
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eb7aa760`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]

## God Nodes (most connected - your core abstractions)
1. `Frontend - React 19 + Vite 7` - 28 edges
2. `useLoans()` - 25 edges
3. `useAuth()` - 13 edges
4. `Backend - Express 5 + Prisma 5` - 10 edges
5. `downloadPaymentReminder()` - 9 edges
6. `calculateAmortization()` - 8 edges
7. `generateWhatsAppLink()` - 8 edges
8. `downloadLoanCalendar()` - 6 edges
9. `Loan Creation` - 6 edges
10. `ErrorBoundary` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Vite Logo` --shares_infrastructure--> `Frontend - React 19 + Vite 7`  [INFERRED]
  vite.svg → README.md
- `React Logo` --shares_infrastructure--> `Frontend - React 19 + Vite 7`  [INFERRED]
  react.svg → README.md
- `Loan Creation` --rationale_for--> `Credit Risk Analysis AI`  [INFERRED]
  README.md → PLAN-github-deployment.md
- `Collections()` --calls--> `useLoans()`  [INFERRED]
  src/pages/Collections.jsx → src/context/LoanContext.jsx
- `Dashboard()` --calls--> `useLoans()`  [INFERRED]
  src/pages/Dashboard.jsx → src/context/LoanContext.jsx

## Hyperedges (group relationships)
- **Frontend Feature Set** — dashboard, client_management, loan_creation, payment_tracking, collections, calculator, document_generation, data_import [EXTRACTED 1.00]
- **Security Infrastructure** — jwt_auth, bcrypt_hashing, helmet_security, cors_middleware, rate_limiter [EXTRACTED 1.00]
- **Frontend UI Libraries** — tailwind_css, recharts, lucide_icons, sonner_toast [EXTRACTED 1.00]
- **Document Export Stack** — jspdf, docx_lib, pagare_template [EXTRACTED 1.00]
- **React Context Providers** — auth_context, loan_context, theme_context [EXTRACTED 1.00]
- **Mobile Offline-First Architecture** — mobile_android, watermelon_db, pull_push_sync_protocol, conflict_resolution, outbox_pattern [EXTRACTED 1.00]
- **AI Integration Ecosystem** — ai_gemma4_integration, risk_analysis_ai, collections_chatbot [EXTRACTED 1.00]
- **Type Validation Enums** — loan_type_enum, frequency_enum, late_fee_type_enum [EXTRACTED 1.00]

## Communities (77 total, 23 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (18): Footer(), Sidebar(), AuthProvider(), useAuth(), LoanProvider(), useLoans(), ThemeProvider(), useTheme() (+10 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (36): AuthContext, Amortization Calculator, Monthly Cash-Flow Projections, Client Management, Detailed Client Profiles, Dashboard, Data Import (CSV/Excel), Document Generation (+28 more)

### Community 2 - "Community 2"
Cohesion: 0.21
Nodes (18): Dashboard(), buildCalendarFile(), createCalendarEvent(), downloadBulkLoanCalendars(), downloadCalendarBlob(), downloadCalendarReminder(), downloadLoanCalendar(), downloadPaymentReminder() (+10 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (18): AppData Portability Strategy, Authentication, Backend - Express 5 + Prisma 5, Bcrypt Password Hashing, CORS Middleware, Payment Frequency Enum, Helmet Security Middleware, JWT Authentication (+10 more)

### Community 4 - "Community 4"
Cohesion: 0.2
Nodes (8): ClientDetail(), Collections(), generateEmailLink(), generateWhatsAppLink(), getReminderMessage(), hasPhoneNumber(), normalizePhoneNumber(), generateReceipt()

### Community 5 - "Community 5"
Cohesion: 0.33
Nodes (8): downloadBlob(), generatePagare(), generatePagareFromTemplate(), generateWordContract(), generateWordReceipt(), getLoanDurationMonths(), getLoanInterestRate(), loadFile()

### Community 6 - "Community 6"
Cohesion: 0.25
Nodes (6): useLoanHealth(), LoanDetail(), Loans(), generateLoanContract(), getLoanDurationMonths(), getLoanInterestRate()

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (11): Conflict Resolution Strategy, Desktop App - Electron 33, Electron Builder, Field Collector Persona, Loan Manager, Mobile App - React Native (Expo), Offline-First Sync Architecture, Outbox Pattern (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (11): AI Integration - Gemma 4, Calendar View, Collections Management, Collections Assistant Chatbot, Fixed-Rate Amortization, Grace Days Configuration, Late Fees Configuration, Loan Creation (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.46
Nodes (4): buildMonthlySchedule(), calculateAmortization(), normalizeFrequency(), splitMonthlySchedule()

### Community 11 - "Community 11"
Cohesion: 0.6
Nodes (5): downloadBlob(), generatePagare(), generatePagareFromTemplate(), getLoanInterestRate(), loadFile()

### Community 12 - "Community 12"
Cohesion: 0.7
Nodes (4): login(), runTests(), testCreateClient(), testCreateClientWithoutPhone()

## Knowledge Gaps
- **64 isolated node(s):** `Data Import (CSV/Excel)`, `Tailwind CSS 4`, `React Router 7`, `Lucide React Icons`, `Sonner Toast Notifications` (+59 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Frontend - React 19 + Vite 7` connect `Community 1` to `Community 8`, `Community 3`, `Community 13`, `Community 7`?**
  _High betweenness centrality (0.267) - this node is a cross-community bridge._
- **Why does `jsPDF` connect `Community 1` to `Community 6`?**
  _High betweenness centrality (0.210) - this node is a cross-community bridge._
- **Why does `useLoans()` connect `Community 0` to `Community 2`, `Community 4`, `Community 6`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Frontend - React 19 + Vite 7` (e.g. with `Vite Logo` and `React Logo`) actually correct?**
  _`Frontend - React 19 + Vite 7` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `useLoans()` (e.g. with `Sidebar()` and `Footer()`) actually correct?**
  _`useLoans()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `useAuth()` (e.g. with `ProtectedRoute()` and `Footer()`) actually correct?**
  _`useAuth()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Data Import (CSV/Excel)`, `Tailwind CSS 4`, `React Router 7` to the rest of the system?**
  _64 weakly-connected nodes found - possible documentation gaps or missing edges._
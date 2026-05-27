# Graph Report - LoanManager-publish  (2026-05-27)

## Corpus Check
- 84 files · ~40,478 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 354 nodes · 496 edges · 41 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `657c531b`
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
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
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
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]

## God Nodes (most connected - your core abstractions)
1. `Frontend - React 19 + Vite 7` - 28 edges
2. `useLoans()` - 25 edges
3. `useLoans()` - 22 edges
4. `useAuth()` - 17 edges
5. `buildMutuoText()` - 15 edges
6. `renderPagareFromTemplate()` - 14 edges
7. `useAuth()` - 13 edges
8. `Backend - Express 5 + Prisma 5` - 10 edges
9. `downloadPaymentReminder()` - 9 edges
10. `calculateAmortization()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Vite Logo` --shares_infrastructure--> `Frontend - React 19 + Vite 7`  [INFERRED]
  vite.svg → README.md
- `React Logo` --shares_infrastructure--> `Frontend - React 19 + Vite 7`  [INFERRED]
  react.svg → README.md
- `Loan Manager` --references--> `Mobile App - React Native (Expo)`  [INFERRED]
  README.md → PLAN-android-app.md
- `Loan Creation` --rationale_for--> `Credit Risk Analysis AI`  [INFERRED]
  README.md → PLAN-github-deployment.md
- `Calculator()` --calls--> `useLoans()`  [INFERRED]
  src/pages/Calculator.jsx → src/context/LoanContext.jsx

## Hyperedges (group relationships)
- **Frontend Feature Set** — dashboard, client_management, loan_creation, payment_tracking, collections, calculator, document_generation, data_import [EXTRACTED 1.00]
- **Security Infrastructure** — jwt_auth, bcrypt_hashing, helmet_security, cors_middleware, rate_limiter [EXTRACTED 1.00]
- **Frontend UI Libraries** — tailwind_css, recharts, lucide_icons, sonner_toast [EXTRACTED 1.00]
- **Document Export Stack** — jspdf, docx_lib, pagare_template [EXTRACTED 1.00]
- **React Context Providers** — auth_context, loan_context, theme_context [EXTRACTED 1.00]
- **Mobile Offline-First Architecture** — mobile_android, watermelon_db, pull_push_sync_protocol, conflict_resolution, outbox_pattern [EXTRACTED 1.00]
- **AI Integration Ecosystem** — ai_gemma4_integration, risk_analysis_ai, collections_chatbot [EXTRACTED 1.00]
- **Type Validation Enums** — loan_type_enum, frequency_enum, late_fee_type_enum [EXTRACTED 1.00]

## Communities (81 total, 26 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (26): Footer(), Sidebar(), AuthProvider(), useAuth(), LoanProvider(), useLoans(), ThemeProvider(), useTheme() (+18 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (40): AuthContext, Amortization Calculator, Monthly Cash-Flow Projections, Client Management, Detailed Client Profiles, Dashboard, Data Import (CSV/Excel), Desktop App - Electron 33 (+32 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (29): buildMutuoDocument(), buildMutuoText(), buildPagareIntroParagraphXml(), buildPagareValueParagraphXml(), downloadBlob(), escapeXml(), fetchBinaryTemplate(), formatMoney() (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.19
Nodes (18): buildCalendarFile(), createCalendarEvent(), downloadBulkLoanCalendars(), downloadCalendarBlob(), downloadCalendarReminder(), downloadLoanCalendar(), downloadPaymentReminder(), escapeIcsText() (+10 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (18): AppData Portability Strategy, Authentication, Backend - Express 5 + Prisma 5, Bcrypt Password Hashing, CORS Middleware, Payment Frequency Enum, Helmet Security Middleware, JWT Authentication (+10 more)

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (14): PagareModal(), cleanRut(), formatRut(), formatRutInput(), isValidRut(), normalizeRut(), downloadBlob(), generatePagare() (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.18
Nodes (11): AI Integration - Gemma 4, Calendar View, Collections Management, Collections Assistant Chatbot, Fixed-Rate Amortization, Grace Days Configuration, Late Fees Configuration, Loan Creation (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.4
Nodes (5): Calculator(), buildMonthlySchedule(), calculateAmortization(), normalizeFrequency(), splitMonthlySchedule()

### Community 8 - "Community 8"
Cohesion: 0.38
Nodes (7): ClientDetail(), formatCurrency(), generateEmailLink(), generateWhatsAppLink(), getReceiptMessage(), hasPhoneNumber(), normalizePhoneNumber()

### Community 9 - "Community 9"
Cohesion: 0.39
Nodes (8): login(), runTests(), testCreateClient(), testCreateClientWithoutPhone(), login(), runTests(), testCreateClient(), testCreateClientWithoutPhone()

### Community 10 - "Community 10"
Cohesion: 0.43
Nodes (4): PortfolioChart(), RevenueChart(), useElementSize(), Recharts

### Community 11 - "Community 11"
Cohesion: 0.29
Nodes (7): Conflict Resolution Strategy, Field Collector Persona, Mobile App - React Native (Expo), Offline-First Sync Architecture, Outbox Pattern, Pull/Push Sync Protocol, WatermelonDB

### Community 13 - "Community 13"
Cohesion: 0.6
Nodes (3): getLoanStatusFromPayments(), getRemainingAmount(), syncLoansForDashboard()

### Community 14 - "Community 14"
Cohesion: 0.6
Nodes (3): cn(), Skeleton(), cn()

### Community 17 - "Community 17"
Cohesion: 0.83
Nodes (3): generateLoanContract(), getLoanDurationMonths(), getLoanInterestRate()

## Knowledge Gaps
- **64 isolated node(s):** `Data Import (CSV/Excel)`, `Tailwind CSS 4`, `React Router 7`, `Lucide React Icons`, `Sonner Toast Notifications` (+59 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Frontend - React 19 + Vite 7` connect `Community 1` to `Community 10`, `Community 4`, `Community 6`?**
  _High betweenness centrality (0.242) - this node is a cross-community bridge._
- **Why does `jsPDF` connect `Community 1` to `Community 17`?**
  _High betweenness centrality (0.205) - this node is a cross-community bridge._
- **Why does `generateLoanContract()` connect `Community 17` to `Community 0`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Frontend - React 19 + Vite 7` (e.g. with `Vite Logo` and `React Logo`) actually correct?**
  _`Frontend - React 19 + Vite 7` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `useLoans()` (e.g. with `Sidebar()` and `Footer()`) actually correct?**
  _`useLoans()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `useLoans()` (e.g. with `Sidebar()` and `RecentActivity()`) actually correct?**
  _`useLoans()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `useAuth()` (e.g. with `ProtectedRoute()` and `Footer()`) actually correct?**
  _`useAuth()` has 8 INFERRED edges - model-reasoned connections that need verification._
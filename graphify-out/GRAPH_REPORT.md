# Graph Report - LoanManager  (2026-05-27)

## Corpus Check
- 112 files · ~1,344,144 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 235 nodes · 326 edges · 15 communities detected
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b16135bf`
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
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]

## God Nodes (most connected - your core abstractions)
1. `useLoans()` - 22 edges
2. `useAuth()` - 17 edges
3. `buildMutuoText()` - 15 edges
4. `renderPagareFromTemplate()` - 14 edges
5. `downloadPaymentReminder()` - 9 edges
6. `generateWhatsAppLink()` - 8 edges
7. `calculateAmortization()` - 7 edges
8. `isValidRut()` - 7 edges
9. `ClientDetail()` - 6 edges
10. `downloadLoanCalendar()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Dashboard()` --calls--> `useLoans()`  [INFERRED]
  src/pages/Dashboard.jsx → src/context/useLoans.js
- `NewLoan()` --calls--> `useLoans()`  [INFERRED]
  src/pages/NewLoan.jsx → src/context/useLoans.js
- `ProtectedRoute()` --calls--> `useAuth()`  [INFERRED]
  src/App.jsx → src/context/useAuth.js
- `PagareModal()` --calls--> `isValidRut()`  [INFERRED]
  src/components/PagareModal.jsx → src/utils/rut.js
- `Sidebar()` --calls--> `useLoans()`  [INFERRED]
  src/components/Sidebar.jsx → src/context/useLoans.js

## Communities (55 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (19): Footer(), Sidebar(), AuthProvider(), LoanProvider(), ThemeProvider(), useAuth(), useLoans(), useTheme() (+11 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (28): buildMutuoDocument(), buildMutuoText(), buildPagareIntroParagraphXml(), buildPagareValueParagraphXml(), downloadBlob(), escapeXml(), fetchBinaryTemplate(), formatMoney() (+20 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (11): ClientDetail(), Dashboard(), Skeleton(), cn(), formatCurrency(), generateEmailLink(), generateWhatsAppLink(), getReceiptMessage() (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.27
Nodes (16): buildCalendarFile(), createCalendarEvent(), downloadBulkLoanCalendars(), downloadCalendarBlob(), downloadLoanCalendar(), downloadPaymentReminder(), escapeIcsText(), formatCurrentUtcStamp() (+8 more)

### Community 4 - "Community 4"
Cohesion: 0.27
Nodes (7): PagareModal(), NewLoan(), cleanRut(), formatRut(), formatRutInput(), isValidRut(), normalizeRut()

### Community 5 - "Community 5"
Cohesion: 0.39
Nodes (4): buildMonthlySchedule(), calculateAmortization(), normalizeFrequency(), splitMonthlySchedule()

### Community 6 - "Community 6"
Cohesion: 0.6
Nodes (5): build_icon(), load_font(), main(), make_gradient(), save_outputs()

### Community 8 - "Community 8"
Cohesion: 0.47
Nodes (3): PortfolioChart(), RevenueChart(), useElementSize()

### Community 9 - "Community 9"
Cohesion: 0.6
Nodes (5): downloadBlob(), generateWordContract(), generateWordReceipt(), getLoanDurationMonths(), getLoanInterestRate()

### Community 10 - "Community 10"
Cohesion: 0.7
Nodes (4): login(), runTests(), testCreateClient(), testCreateClientWithoutPhone()

### Community 11 - "Community 11"
Cohesion: 0.6
Nodes (3): generateLoanContract(), getLoanDurationMonths(), getLoanInterestRate()

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatRutInput()` connect `Community 4` to `Community 0`, `Community 2`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `formatRut()` connect `Community 4` to `Community 1`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `useLoans()` connect `Community 0` to `Community 2`, `Community 4`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `useLoans()` (e.g. with `Sidebar()` and `RecentActivity()`) actually correct?**
  _`useLoans()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `useAuth()` (e.g. with `ProtectedRoute()` and `Footer()`) actually correct?**
  _`useAuth()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
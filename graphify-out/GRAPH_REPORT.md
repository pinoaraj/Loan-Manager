# Graph Report - LoanManager  (2026-05-27)

## Corpus Check
- 112 files · ~1,345,155 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 251 nodes · 375 edges · 16 communities detected
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aa31b89f`
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
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]

## God Nodes (most connected - your core abstractions)
1. `useLoans()` - 22 edges
2. `useAuth()` - 17 edges
3. `renderPagareFromTemplate()` - 15 edges
4. `buildMutuoText()` - 15 edges
5. `buildMutuoParagraphs()` - 12 edges
6. `downloadPaymentReminder()` - 9 edges
7. `generateWhatsAppLink()` - 8 edges
8. `buildMutuoDocument()` - 8 edges
9. `generateWordContract()` - 8 edges
10. `calculateAmortization()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `ProtectedRoute()` --calls--> `useAuth()`  [INFERRED]
  src/App.jsx → src/context/useAuth.js
- `NewLoan()` --calls--> `useLoans()`  [INFERRED]
  src/pages/NewLoan.jsx → src/context/useLoans.js
- `PagareModal()` --calls--> `isValidRut()`  [INFERRED]
  src/components/PagareModal.jsx → src/utils/rut.js
- `Sidebar()` --calls--> `useLoans()`  [INFERRED]
  src/components/Sidebar.jsx → src/context/useLoans.js
- `PortfolioChart()` --calls--> `useElementSize()`  [INFERRED]
  src/components/dashboard/PortfolioChart.jsx → src/hooks/useElementSize.js

## Communities (56 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (17): Footer(), Sidebar(), LoanProvider(), useAuth(), useLoans(), useTheme(), RecentActivity(), useLoanHealth() (+9 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (31): buildMutuoDocument(), buildMutuoParagraphs(), buildMutuoText(), buildPagareIntroParagraphXml(), buildPagareValueParagraphXml(), downloadBlob(), escapeXml(), fetchBinaryTemplate() (+23 more)

### Community 2 - "Community 2"
Cohesion: 0.27
Nodes (16): buildCalendarFile(), createCalendarEvent(), downloadBulkLoanCalendars(), downloadCalendarBlob(), downloadLoanCalendar(), downloadPaymentReminder(), escapeIcsText(), formatCurrentUtcStamp() (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.25
Nodes (8): ClientDetail(), formatCurrency(), generateEmailLink(), generateWhatsAppLink(), getReceiptMessage(), getReminderMessage(), hasPhoneNumber(), normalizePhoneNumber()

### Community 4 - "Community 4"
Cohesion: 0.27
Nodes (7): PagareModal(), NewLoan(), cleanRut(), formatRut(), formatRutInput(), isValidRut(), normalizeRut()

### Community 5 - "Community 5"
Cohesion: 0.35
Nodes (10): build_cutout_mask(), build_icon(), build_preview(), build_shadow(), build_svg(), build_symbol_mask(), load_font(), main() (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (5): AuthProvider(), ThemeProvider(), App(), ProtectedRoute(), useResponsiveDesktopScale()

### Community 7 - "Community 7"
Cohesion: 0.44
Nodes (9): buildScheduleTableRows(), downloadBlob(), generateWordContract(), generateWordReceipt(), getAmount(), getDateLabel(), getLoanDurationMonths(), getLoanInterestRate() (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.39
Nodes (4): buildMonthlySchedule(), calculateAmortization(), normalizeFrequency(), splitMonthlySchedule()

### Community 9 - "Community 9"
Cohesion: 0.47
Nodes (8): generateLoanContract(), generateReceipt(), getAmount(), getDateLabel(), getLoanDurationMonths(), getLoanInterestRate(), getScheduleRows(), getText()

### Community 11 - "Community 11"
Cohesion: 0.47
Nodes (3): PortfolioChart(), RevenueChart(), useElementSize()

### Community 12 - "Community 12"
Cohesion: 0.7
Nodes (4): login(), runTests(), testCreateClient(), testCreateClientWithoutPhone()

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatRutInput()` connect `Community 4` to `Community 0`, `Community 3`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `formatRut()` connect `Community 4` to `Community 1`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `useLoans()` connect `Community 0` to `Community 3`, `Community 4`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `useLoans()` (e.g. with `Sidebar()` and `RecentActivity()`) actually correct?**
  _`useLoans()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `useAuth()` (e.g. with `ProtectedRoute()` and `Footer()`) actually correct?**
  _`useAuth()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
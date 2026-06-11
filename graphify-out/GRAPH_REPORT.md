# Graph Report - LoanManager  (2026-06-11)

## Corpus Check
- 145 files · ~1,477,460 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 389 nodes · 610 edges · 28 communities detected
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `54a9ad47`
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
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]

## God Nodes (most connected - your core abstractions)
1. `useLoans()` - 22 edges
2. `useAuth()` - 17 edges
3. `renderPagareFromTemplate()` - 15 edges
4. `buildMutuoText()` - 15 edges
5. `buildMutuoParagraphs()` - 14 edges
6. `formatStoredDate()` - 13 edges
7. `useSession()` - 12 edges
8. `formatCurrency()` - 12 edges
9. `build_icon()` - 11 edges
10. `parseStoredDate()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Sidebar()` --calls--> `useLoans()`  [INFERRED]
  src/components/Sidebar.jsx → src/context/useLoans.js
- `IndexScreen()` --calls--> `useSession()`  [INFERRED]
  Mobiloan/app/index.tsx → Mobiloan/src/providers/AppProviders.tsx
- `RootNavigator()` --calls--> `useSession()`  [INFERRED]
  Mobiloan/app/_layout.tsx → Mobiloan/src/providers/AppProviders.tsx
- `async()` --calls--> `openWhatsApp()`  [INFERRED]
  Mobiloan/app/(app)/index.tsx → Mobiloan/src/lib/contact.ts
- `AppLayout()` --calls--> `useSession()`  [INFERRED]
  Mobiloan/app/(app)/_layout.tsx → Mobiloan/src/providers/AppProviders.tsx

## Communities (69 total, 14 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (25): PagareModal(), useLoans(), RecentActivity(), ClientDetail(), Clients(), Collections(), Dashboard(), ImportData() (+17 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (27): async(), IndexScreen(), AppLayout(), RootNavigator(), async(), useClientDetail(), useClients(), useCollectionQueue() (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (32): buildMutuoDocument(), buildMutuoParagraphs(), buildMutuoText(), buildPagareIntroParagraphXml(), buildPagareValueParagraphXml(), downloadBlob(), escapeXml(), fetchBinaryTemplate() (+24 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (11): Footer(), Sidebar(), AuthProvider(), LoanProvider(), ThemeProvider(), useAuth(), useTheme(), Login() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.27
Nodes (16): buildCalendarFile(), createCalendarEvent(), downloadBulkLoanCalendars(), downloadCalendarBlob(), downloadLoanCalendar(), downloadPaymentReminder(), escapeIcsText(), formatCurrentUtcStamp() (+8 more)

### Community 5 - "Community 5"
Cohesion: 0.21
Nodes (10): useLoanHealth(), getFrequencyLabel(), getLoanTypeLabel(), LoanDetail(), Loans(), compareStoredDates(), formatStoredDate(), getStoredDateDayLabel() (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (5): buildMonthlySchedule(), calculateAmortization(), normalizeFrequency(), splitMonthlySchedule(), formatCurrency()

### Community 7 - "Community 7"
Cohesion: 0.26
Nodes (14): build_cutout_mask(), build_icon(), build_preview(), build_shadow(), build_svg(), build_symbol_mask(), draw_coin(), draw_document() (+6 more)

### Community 8 - "Community 8"
Cohesion: 0.42
Nodes (10): buildScheduleTableRows(), downloadBlob(), generateWordContract(), generateWordReceipt(), getAmount(), getDateLabel(), getFileSafeLabel(), getLoanDurationMonths() (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.42
Nodes (10): downloadBlob(), generateLoanContract(), generateReceipt(), getAmount(), getDateLabel(), getFileSafeLabel(), getLoanDurationMonths(), getLoanInterestRate() (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.36
Nodes (6): startServer(), ensureDatabaseCompatibility(), ensureSyncDeletedRecordsTable(), ensureTransactionSyncColumns(), getTableColumns(), indexExists()

### Community 16 - "Community 16"
Cohesion: 0.47
Nodes (3): PortfolioChart(), RevenueChart(), useElementSize()

### Community 17 - "Community 17"
Cohesion: 0.7
Nodes (4): login(), runTests(), testCreateClient(), testCreateClientWithoutPhone()

### Community 25 - "Community 25"
Cohesion: 0.83
Nodes (3): getLoanStatusFromPayments(), registerPaymentTransaction(), toAmount()

## Knowledge Gaps
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatStoredDate()` connect `Community 5` to `Community 0`, `Community 9`, `Community 2`, `Community 8`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `compareStoredDates()` connect `Community 5` to `Community 0`, `Community 2`, `Community 4`, `Community 8`, `Community 9`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `formatCurrency()` connect `Community 6` to `Community 0`, `Community 5`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `useLoans()` (e.g. with `Sidebar()` and `RecentActivity()`) actually correct?**
  _`useLoans()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `useAuth()` (e.g. with `ProtectedRoute()` and `Footer()`) actually correct?**
  _`useAuth()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `buildMutuoParagraphs()` (e.g. with `formatRut()` and `getStoredDateDayLabel()`) actually correct?**
  _`buildMutuoParagraphs()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
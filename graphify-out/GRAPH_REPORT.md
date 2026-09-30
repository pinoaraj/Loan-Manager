# Graph Report - LoanManager  (2026-09-30)

## Corpus Check
- 194 files · ~1,523,171 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 600 nodes · 941 edges · 49 communities detected
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 58 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e835c9f8`
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
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]

## God Nodes (most connected - your core abstractions)
1. `useLoans()` - 22 edges
2. `useAuth()` - 17 edges
3. `renderPagareFromTemplate()` - 15 edges
4. `buildMutuoText()` - 15 edges
5. `buildMutuoParagraphs()` - 14 edges
6. `completeAnalysis()` - 13 edges
7. `formatStoredDate()` - 13 edges
8. `useSession()` - 12 edges
9. `formatCurrency()` - 12 edges
10. `GET()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `ProtectedRoute()` --calls--> `useAuth()`  [INFERRED]
  src/App.jsx → src/context/useAuth.js
- `Sidebar()` --calls--> `useLoans()`  [INFERRED]
  src/components/Sidebar.jsx → src/context/useLoans.js
- `Dashboard()` --calls--> `useLoans()`  [INFERRED]
  src/pages/Dashboard.jsx → src/context/useLoans.js
- `NewLoan()` --calls--> `useLoans()`  [INFERRED]
  src/pages/NewLoan.jsx → src/context/useLoans.js
- `analyzeWithGemini()` --calls--> `boxingKnowledgePrompt()`  [INFERRED]
  fight-ai-web-mvp/app/api/analyze/route.ts → fight-ai-web-mvp/lib/boxingKnowledge.ts

## Communities (108 total, 21 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (36): async(), handleSync(), IndexScreen(), AppLayout(), RootLayout(), RootNavigator(), NewClientScreen(), NewLoanScreen() (+28 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (36): compareStoredDates(), getStoredDateDayLabel(), parseStoredDate(), buildMutuoDocument(), buildMutuoParagraphs(), buildMutuoText(), buildPagareIntroParagraphXml(), buildPagareValueParagraphXml() (+28 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (33): absoluteTime(), activeStatus(), buildSegmentPrompt(), claimAndRun(), cleanGeminiJson(), completeAnalysis(), deferProviderRetry(), forceRetryIfAbandoned() (+25 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (14): analyze(), decodePreview(), frameTarget(), generateCompatibleFrame(), jumpMainPreview(), parseResponse(), playEvidence(), requestCompatibleFrame() (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (7): derivePaymentStatus(), isPastDue(), buildMonthlySchedule(), calculateAmortization(), normalizeFrequency(), splitMonthlySchedule(), createClientMutationId()

### Community 5 - "Community 5"
Cohesion: 0.27
Nodes (16): buildCalendarFile(), createCalendarEvent(), downloadBulkLoanCalendars(), downloadCalendarBlob(), downloadLoanCalendar(), downloadPaymentReminder(), escapeIcsText(), formatCurrentUtcStamp() (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.26
Nodes (14): build_cutout_mask(), build_icon(), build_preview(), build_shadow(), build_svg(), build_symbol_mask(), draw_coin(), draw_document() (+6 more)

### Community 7 - "Community 7"
Cohesion: 0.27
Nodes (11): analyzeWithGemini(), cleanGeminiJson(), field(), generateCoachJson(), interactionOutputText(), makeCompactCompatibleClip(), makeThreeMinuteClip(), normalizeReport() (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.23
Nodes (10): clone(), defaultState(), derivePaymentStatus(), getStorage(), hydrateOutboxRow(), isPastDue(), loadState(), saveState() (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.26
Nodes (10): buildApiUrl(), getApiCandidates(), normalizeApiUrl(), resolveDefaultApiUrl(), resolveExpoHost(), resolveHostCandidates(), describeAttemptedUrls(), isNetworkError() (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.27
Nodes (11): ClientDetail(), formatCurrency(), generateEmailLink(), generateMailtoLink(), generateWhatsAppLink(), getReceiptMessage(), getReminderMessage(), hasPhoneNumber() (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.21
Nodes (7): PagareModal(), Clients(), NewLoan(), cleanRut(), formatRutInput(), isValidRut(), normalizeRut()

### Community 12 - "Community 12"
Cohesion: 0.21
Nodes (6): Footer(), Sidebar(), LoanProvider(), useAuth(), useTheme(), Login()

### Community 13 - "Community 13"
Cohesion: 0.24
Nodes (6): useLoanHealth(), getFrequencyLabel(), getLoanTypeLabel(), LoanDetail(), Loans(), formatStoredDate()

### Community 14 - "Community 14"
Cohesion: 0.36
Nodes (7): shutdown(), startServer(), ensureDatabaseCompatibility(), ensureSyncDeletedRecordsTable(), ensureTransactionSyncColumns(), getTableColumns(), indexExists()

### Community 15 - "Community 15"
Cohesion: 0.24
Nodes (4): useLoans(), RecentActivity(), Collections(), ImportData()

### Community 16 - "Community 16"
Cohesion: 0.42
Nodes (10): buildScheduleTableRows(), downloadBlob(), generateWordContract(), generateWordReceipt(), getAmount(), getDateLabel(), getFileSafeLabel(), getLoanDurationMonths() (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.42
Nodes (10): downloadBlob(), generateLoanContract(), generateReceipt(), getAmount(), getDateLabel(), getFileSafeLabel(), getLoanDurationMonths(), getLoanInterestRate() (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.4
Nodes (9): buildReminderNotes(), buildReminderTitle(), createCollectionReminder(), ensureCalendarPermission(), ensureNotificationChannel(), ensureNotificationPermission(), resolveReminderDate(), resolveWritableCalendarId() (+1 more)

### Community 19 - "Community 19"
Cohesion: 0.22
Nodes (5): AuthProvider(), ThemeProvider(), App(), ProtectedRoute(), useResponsiveDesktopScale()

### Community 21 - "Community 21"
Cohesion: 0.39
Nodes (4): buildMonthlySchedule(), calculateAmortization(), normalizeFrequency(), splitMonthlySchedule()

### Community 23 - "Community 23"
Cohesion: 0.32
Nodes (3): Get-LocalIPv4(), Show-Ready(), Write-Banner()

### Community 24 - "Community 24"
Cohesion: 0.29
Nodes (3): Dashboard(), Skeleton(), cn()

### Community 25 - "Community 25"
Cohesion: 0.52
Nodes (5): chunkedFrame(), POST(), receiveBody(), renderFrame(), requestedTime()

### Community 30 - "Community 30"
Cohesion: 0.47
Nodes (3): PortfolioChart(), RevenueChart(), useElementSize()

### Community 32 - "Community 32"
Cohesion: 0.7
Nodes (4): login(), runTests(), testCreateClient(), testCreateClientWithoutPhone()

### Community 35 - "Community 35"
Cohesion: 0.83
Nodes (3): isLocalHostname(), middleware(), requestHostname()

### Community 41 - "Community 41"
Cohesion: 0.83
Nodes (3): getLoanStatusFromPayments(), registerPaymentTransaction(), toAmount()

## Knowledge Gaps
- **1 isolated node(s):** `BaseHTTPRequestHandler`
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatStoredDate()` connect `Community 13` to `Community 1`, `Community 10`, `Community 15`, `Community 16`, `Community 17`, `Community 20`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `compareStoredDates()` connect `Community 1` to `Community 5`, `Community 10`, `Community 11`, `Community 13`, `Community 16`, `Community 17`, `Community 20`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `calculateAmortization()` connect `Community 4` to `Community 0`, `Community 8`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `useLoans()` (e.g. with `Sidebar()` and `RecentActivity()`) actually correct?**
  _`useLoans()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `useAuth()` (e.g. with `ProtectedRoute()` and `Footer()`) actually correct?**
  _`useAuth()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `buildMutuoParagraphs()` (e.g. with `formatRut()` and `getStoredDateDayLabel()`) actually correct?**
  _`buildMutuoParagraphs()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `BaseHTTPRequestHandler` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
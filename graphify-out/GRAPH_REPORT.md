# Graph Report - LoanManager  (2026-11-02)

## Corpus Check
- 350 files · ~1,600,234 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 946 nodes · 1675 edges · 59 communities detected
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 132 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9b22e39f`
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
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]

## God Nodes (most connected - your core abstractions)
1. `formatCurrency()` - 35 edges
2. `useAuth()` - 31 edges
3. `useLoans()` - 31 edges
4. `createApp()` - 20 edges
5. `formatStoredDate()` - 19 edges
6. `compareStoredDates()` - 17 edges
7. `can()` - 16 edges
8. `useDialogFocus()` - 15 edges
9. `renderPagareFromTemplate()` - 15 edges
10. `buildMutuoText()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `checkAndApplyLateFees()` --calls--> `differenceInDays()`  [INFERRED]
  server/utils/fees.js → Mobiloan/src/lib/dates.ts
- `checkAndApplyLateFees()` --calls--> `startOfDay()`  [INFERRED]
  server/utils/fees.js → saas/api/src/routes/dashboard.js
- `generateMockData()` --calls--> `addMonths()`  [INFERRED]
  src/utils/mockData.js → saas/api/src/domain/amortization.js
- `ConfirmModal()` --calls--> `useDialogFocus()`  [INFERRED]
  src/components/ConfirmModal.jsx → saas/web/src/hooks/useDialogFocus.js
- `OrganizationDetail()` --calls--> `useDialogFocus()`  [INFERRED]
  saas/web/src/components/MasterApp.jsx → saas/web/src/hooks/useDialogFocus.js

## Communities (135 total, 25 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (59): ConfirmModal(), getPreferredLoanId(), PagareModal(), PaymentModal(), PaymentScheduleTable(), toAmount(), Footer(), Sidebar() (+51 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (43): async(), handleSync(), IndexScreen(), AppLayout(), RootLayout(), RootNavigator(), NewClientScreen(), async() (+35 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (21): addMonths(), calculateAmortization(), normalizeFrequency(), splitMoney(), recordAudit(), decimal(), isPositiveMoney(), money() (+13 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (37): getStoredDateDayLabel(), parseStoredDate(), buildMutuoDocument(), buildMutuoParagraphs(), buildMutuoText(), buildPagareIntroParagraphXml(), buildPagareValueParagraphXml(), downloadBlob() (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.1
Nodes (23): getMarket(), isCurrencyAllowed(), requireBillingRole(), bearerClaims(), createUserToken(), establishSession(), hashToken(), issueToken() (+15 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (16): BillingView(), LoansView(), MasterApp(), OrganizationDetail(), statusCount(), resolveLocale(), Billing(), api() (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (33): absoluteTime(), activeStatus(), buildSegmentPrompt(), claimAndRun(), cleanGeminiJson(), completeAnalysis(), deferProviderRetry(), forceRetryIfAbandoned() (+25 more)

### Community 7 - "Community 7"
Cohesion: 0.1
Nodes (17): NewLoanScreen(), derivePaymentStatus(), isPastDue(), useAllClients(), useCreateLocalLoan(), buildMonthlySchedule(), calculateAmortization(), normalizeFrequency() (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (10): AuthProvider(), LoanProvider(), ThemeProvider(), App(), Layout(), PageLoader(), ProtectedRoute(), useResponsiveDesktopScale() (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (14): analyze(), decodePreview(), frameTarget(), generateCompatibleFrame(), jumpMainPreview(), parseResponse(), playEvidence(), requestCompatibleFrame() (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.22
Nodes (15): deployOverSsh(), main(), run(), shellQuote(), verifyDatabase(), loadProductionEnv(), redactDatabaseTarget(), required() (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (8): requireSaasAccess(), createAuthRouter(), createLoansRouter(), createMembersRouter(), createPaymentsRouter(), createApp(), runMiddleware(), requestAs()

### Community 12 - "Community 12"
Cohesion: 0.35
Nodes (16): buildCalendarFile(), createCalendarEvent(), downloadBulkLoanCalendars(), downloadCalendarBlob(), downloadLoanCalendar(), downloadPaymentReminder(), escapeIcsText(), formatCurrentUtcStamp() (+8 more)

### Community 13 - "Community 13"
Cohesion: 0.26
Nodes (14): build_cutout_mask(), build_icon(), build_preview(), build_shadow(), build_svg(), build_symbol_mask(), draw_coin(), draw_document() (+6 more)

### Community 14 - "Community 14"
Cohesion: 0.27
Nodes (11): analyzeWithGemini(), cleanGeminiJson(), field(), generateCoachJson(), interactionOutputText(), makeCompactCompatibleClip(), makeThreeMinuteClip(), normalizeReport() (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.23
Nodes (10): clone(), defaultState(), derivePaymentStatus(), getStorage(), hydrateOutboxRow(), isPastDue(), loadState(), saveState() (+2 more)

### Community 16 - "Community 16"
Cohesion: 0.26
Nodes (10): buildApiUrl(), getApiCandidates(), normalizeApiUrl(), resolveDefaultApiUrl(), resolveExpoHost(), resolveHostCandidates(), describeAttemptedUrls(), isNetworkError() (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.2
Nodes (8): hasSaasAccess(), mapMercadoPagoStatus(), mapStripeStatus(), asDateFromUnix(), syncMercadoPagoSubscription(), syncStripeSubscription(), createMercadoPagoWebhookRouter(), createStripeWebhookHandler()

### Community 18 - "Community 18"
Cohesion: 0.23
Nodes (8): getConfiguredProviders(), getProviderPlanId(), getPublicPlans(), authenticate(), createMercadoPagoProvider(), billingReturnUrls(), createStripeProvider(), createBillingRouter()

### Community 19 - "Community 19"
Cohesion: 0.21
Nodes (4): buildClientData(), normalizeFrequency(), sameLoanTerms(), toDateKey()

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (10): downloadBlob(), generateLoanContract(), generateReceipt(), getAmount(), getDateLabel(), getFileSafeLabel(), getLoanDurationMonths(), getLoanInterestRate() (+2 more)

### Community 21 - "Community 21"
Cohesion: 0.5
Nodes (10): buildScheduleTableRows(), downloadBlob(), generateWordContract(), generateWordReceipt(), getAmount(), getDateLabel(), getFileSafeLabel(), getLoanDurationMonths() (+2 more)

### Community 22 - "Community 22"
Cohesion: 0.36
Nodes (7): shutdown(), startServer(), ensureDatabaseCompatibility(), ensureSyncDeletedRecordsTable(), ensureTransactionSyncColumns(), getTableColumns(), indexExists()

### Community 23 - "Community 23"
Cohesion: 0.25
Nodes (6): requireRoles(), createClientsRouter(), createDataRouter(), withServer(), run(), withServer()

### Community 24 - "Community 24"
Cohesion: 0.36
Nodes (5): Calculator(), buildMonthlySchedule(), calculateAmortization(), normalizeFrequency(), splitMonthlySchedule()

### Community 26 - "Community 26"
Cohesion: 0.27
Nodes (5): buildPortablePackage(), buildSchedule(), createAuthHeaders(), importPackage(), request()

### Community 27 - "Community 27"
Cohesion: 0.32
Nodes (3): Get-LocalIPv4(), Show-Ready(), Write-Banner()

### Community 28 - "Community 28"
Cohesion: 0.39
Nodes (3): PortfolioChart(), RevenueChart(), useElementSize()

### Community 29 - "Community 29"
Cohesion: 0.52
Nodes (5): chunkedFrame(), POST(), receiveBody(), renderFrame(), requestedTime()

### Community 32 - "Community 32"
Cohesion: 0.52
Nodes (4): activeLoanCapacity(), getOrganizationEntitlements(), memberCapacity(), getPlanLimits()

### Community 38 - "Community 38"
Cohesion: 0.7
Nodes (4): login(), runTests(), testCreateClient(), testCreateClientWithoutPhone()

### Community 41 - "Community 41"
Cohesion: 0.5
Nodes (3): createCorsOrigin(), isAllowedCorsOrigin(), isPrivateNetworkHost()

### Community 44 - "Community 44"
Cohesion: 0.83
Nodes (3): isLocalHostname(), middleware(), requestHostname()

### Community 50 - "Community 50"
Cohesion: 0.83
Nodes (3): getLoanStatusFromPayments(), registerPaymentTransaction(), toAmount()

## Knowledge Gaps
- **1 isolated node(s):** `BaseHTTPRequestHandler`
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `checkAndApplyLateFees()` connect `Community 2` to `Community 1`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `differenceInDays()` connect `Community 1` to `Community 2`, `Community 7`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `useAuth()` (e.g. with `ProtectedRoute()` and `Footer()`) actually correct?**
  _`useAuth()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `useLoans()` (e.g. with `Sidebar()` and `RecentActivity()`) actually correct?**
  _`useLoans()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `createApp()` (e.g. with `createCorsOrigin()` and `createStripeWebhookHandler()`) actually correct?**
  _`createApp()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `formatStoredDate()` (e.g. with `LoanDetail()` and `buildMutuoParagraphs()`) actually correct?**
  _`formatStoredDate()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `BaseHTTPRequestHandler` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
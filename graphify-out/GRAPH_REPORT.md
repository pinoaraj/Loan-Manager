# Graph Report - LoanManager  (2026-11-19)

## Corpus Check
- 367 files · ~1,629,708 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1115 nodes · 2062 edges · 79 communities detected
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 164 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6c2a85c3`
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
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
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
1. `formatCurrency()` - 35 edges
2. `useAuth()` - 31 edges
3. `useLoans()` - 31 edges
4. `createApp()` - 20 edges
5. `formatStoredDate()` - 19 edges
6. `formatCurrency()` - 17 edges
7. `compareStoredDates()` - 17 edges
8. `formatDate()` - 16 edges
9. `can()` - 16 edges
10. `useDialogFocus()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `checkAndApplyLateFees()` --calls--> `differenceInDays()`  [INFERRED]
  server/utils/fees.js → Mobiloan/src/lib/dates.ts
- `LoanDetail()` --calls--> `getLoanHealth()`  [INFERRED]
  src/pages/LoanDetail.jsx → Mobiloan/src/lib/loanHealth.ts
- `PagareModal()` --calls--> `useDialogFocus()`  [INFERRED]
  src/components/PagareModal.jsx → saas/web/src/hooks/useDialogFocus.js
- `Sidebar()` --calls--> `can()`  [INFERRED]
  src/components/Sidebar.jsx → saas/web/src/utils/permissions.js
- `ClientDetail()` --calls--> `useDialogFocus()`  [INFERRED]
  src/pages/ClientDetail.jsx → saas/web/src/hooks/useDialogFocus.js

## Communities (156 total, 23 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (21): addMonths(), calculateAmortization(), normalizeFrequency(), splitMoney(), recordAudit(), decimal(), isPositiveMoney(), money() (+13 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (37): getStoredDateDayLabel(), parseStoredDate(), buildMutuoDocument(), buildMutuoParagraphs(), buildMutuoText(), buildPagareIntroParagraphXml(), buildPagareValueParagraphXml(), downloadBlob() (+29 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (16): BillingView(), LoansView(), MasterApp(), OrganizationDetail(), statusCount(), resolveLocale(), Billing(), api() (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (33): absoluteTime(), activeStatus(), buildSegmentPrompt(), claimAndRun(), cleanGeminiJson(), completeAnalysis(), deferProviderRetry(), forceRetryIfAbandoned() (+25 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (22): getMarket(), isCurrencyAllowed(), bearerClaims(), createUserToken(), establishSession(), hashToken(), issueToken(), newOpaqueToken() (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (18): executeImport(), handlePick(), handleReview(), useImportPortableSnapshot(), autoMapColumns(), buildColumnNames(), buildPortablePreview(), buildSpreadsheetPreview() (+10 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (10): AuthProvider(), LoanProvider(), ThemeProvider(), App(), Layout(), PageLoader(), ProtectedRoute(), useResponsiveDesktopScale() (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (5): Footer(), Sidebar(), useAuth(), useTheme(), Login()

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (14): analyze(), decodePreview(), frameTarget(), generateCompatibleFrame(), jumpMainPreview(), parseResponse(), playEvidence(), requestCompatibleFrame() (+6 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (14): RootLayout(), RootNavigator(), buildApiUrl(), getApiCandidates(), normalizeApiUrl(), resolveDefaultApiUrl(), resolveExpoHost(), resolveHostCandidates() (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (12): IndexScreen(), useDeleteLocalLoan(), useManualSync(), useQueuePayment(), useRecalculateLoan(), useSetLoanPaused(), formatDateTime(), formatCurrency() (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (13): async(), handleSync(), useClientDetail(), useLoanDetail(), usePendingOutbox(), useRejectedOutbox(), useSyncSnapshot(), useDiscardRejectedMutation() (+5 more)

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (8): requireSaasAccess(), createAuthRouter(), createMembersRouter(), createMercadoPagoWebhookRouter(), createStripeWebhookHandler(), createApp(), runMiddleware(), requestAs()

### Community 13 - "Community 13"
Cohesion: 0.17
Nodes (11): ConfirmModal(), PaymentModal(), DashboardKPI(), KPICard(), useDialogFocus(), formatCurrency(), getCurrencyFractionDigits(), getCurrencyStep() (+3 more)

### Community 14 - "Community 14"
Cohesion: 0.19
Nodes (18): buildContractHtml(), buildInstallmentsCsv(), buildPortfolioCsv(), buildPromissoryNoteHtml(), ensureSharing(), escapeHtml(), getFileSafeLabel(), numeroALetras() (+10 more)

### Community 15 - "Community 15"
Cohesion: 0.16
Nodes (15): async(), useCollectionQueue(), usePaymentAlerts(), normalizePhone(), openEmail(), openExternalUrl(), openPhoneCall(), openWhatsApp() (+7 more)

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (15): deployOverSsh(), main(), run(), shellQuote(), verifyDatabase(), loadProductionEnv(), redactDatabaseTarget(), required() (+7 more)

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (9): loanTypeLabel(), useDeleteLocalClient(), useUpdateLocalClient(), frequencyLabel(), loanStatusLabel(), loanTypeLabel(), normalize(), paymentMethodLabel() (+1 more)

### Community 18 - "Community 18"
Cohesion: 0.19
Nodes (11): hasSaasAccess(), mapMercadoPagoStatus(), mapStripeStatus(), asDateFromUnix(), syncMercadoPagoSubscription(), syncStripeSubscription(), authenticate(), requireBillingRole() (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.35
Nodes (16): buildCalendarFile(), createCalendarEvent(), downloadBulkLoanCalendars(), downloadCalendarBlob(), downloadLoanCalendar(), downloadPaymentReminder(), escapeIcsText(), formatCurrentUtcStamp() (+8 more)

### Community 20 - "Community 20"
Cohesion: 0.29
Nodes (12): ClientDetail(), isValidEmail(), isValidEmail(), formatCurrency(), generateEmailLink(), generateMailtoLink(), generateWhatsAppLink(), getReceiptMessage() (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (3): derivePaymentStatus(), isPastDue(), createClientMutationId()

### Community 22 - "Community 22"
Cohesion: 0.2
Nodes (12): clone(), defaultState(), derivePaymentStatus(), getStorage(), hydrateOutboxRow(), inferOrigin(), isPastDue(), loadState() (+4 more)

### Community 23 - "Community 23"
Cohesion: 0.19
Nodes (9): useCollectionProjections(), useDashboardStats(), useRecentActivity(), digitsOnly(), formatAmountInput(), formatCompactCurrency(), formatCurrency(), formatDate() (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.19
Nodes (8): requireRoles(), createClientsRouter(), createDataRouter(), createLoansRouter(), createPaymentsRouter(), withServer(), run(), withServer()

### Community 25 - "Community 25"
Cohesion: 0.26
Nodes (14): build_cutout_mask(), build_icon(), build_preview(), build_shadow(), build_svg(), build_symbol_mask(), draw_coin(), draw_document() (+6 more)

### Community 26 - "Community 26"
Cohesion: 0.27
Nodes (11): analyzeWithGemini(), cleanGeminiJson(), field(), generateCoachJson(), interactionOutputText(), makeCompactCompatibleClip(), makeThreeMinuteClip(), normalizeReport() (+3 more)

### Community 27 - "Community 27"
Cohesion: 0.22
Nodes (10): handleCreate(), isValidDate(), isValidDateInput(), parseDateInput(), parseStoredDate(), toLocalDateKey(), toStoredDueDate(), open() (+2 more)

### Community 28 - "Community 28"
Cohesion: 0.21
Nodes (8): Clients(), ChartSkeleton(), Dashboard(), getPaymentDetailPath(), Skeleton(), cn(), can(), capabilitiesFor()

### Community 29 - "Community 29"
Cohesion: 0.22
Nodes (5): useLoans(), RecentActivity(), ImportData(), isValidEmail(), NewLoan()

### Community 30 - "Community 30"
Cohesion: 0.21
Nodes (7): describeReminderResult(), formatAmount(), formatLongDate(), getReceiptMessage(), getReminderMessage(), handleAlertReminder(), handleAlertWhatsApp()

### Community 31 - "Community 31"
Cohesion: 0.28
Nodes (7): getPreferredLoanId(), PagareModal(), getPaymentDetailPath(), Loans(), compareStoredDates(), toStoredLocaleDate(), isValidRut()

### Community 32 - "Community 32"
Cohesion: 0.27
Nodes (10): buildCandidates(), cancelAutoReminders(), canNotify(), ensureChannel(), getAutoReminderEnabled(), performSync(), runExclusive(), setAutoRemindersEnabled() (+2 more)

### Community 33 - "Community 33"
Cohesion: 0.5
Nodes (10): downloadBlob(), generateLoanContract(), generateReceipt(), getAmount(), getDateLabel(), getFileSafeLabel(), getLoanDurationMonths(), getLoanInterestRate() (+2 more)

### Community 34 - "Community 34"
Cohesion: 0.5
Nodes (10): buildScheduleTableRows(), downloadBlob(), generateWordContract(), generateWordReceipt(), getAmount(), getDateLabel(), getFileSafeLabel(), getLoanDurationMonths() (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.21
Nodes (4): buildClientData(), normalizeFrequency(), sameLoanTerms(), toDateKey()

### Community 36 - "Community 36"
Cohesion: 0.35
Nodes (7): Calculator(), addMonthsClamped(), buildMonthlySchedule(), calculateAmortization(), normalizeFrequency(), splitMonthlySchedule(), toLocalNoon()

### Community 37 - "Community 37"
Cohesion: 0.27
Nodes (7): PaymentScheduleTable(), toAmount(), Collections(), getPaymentDetailPath(), TabButton(), getReminderEmail(), getReminderMessage()

### Community 38 - "Community 38"
Cohesion: 0.36
Nodes (7): shutdown(), startServer(), ensureDatabaseCompatibility(), ensureSyncDeletedRecordsTable(), ensureTransactionSyncColumns(), getTableColumns(), indexExists()

### Community 39 - "Community 39"
Cohesion: 0.25
Nodes (6): getConfiguredProviders(), getProviderPlanId(), getPublicPlans(), createMercadoPagoProvider(), billingReturnUrls(), createStripeProvider()

### Community 40 - "Community 40"
Cohesion: 0.2
Nodes (3): AppLayout(), useClients(), useLoans()

### Community 41 - "Community 41"
Cohesion: 0.4
Nodes (9): buildReminderNotes(), buildReminderTitle(), createCollectionReminder(), ensureCalendarPermission(), ensureNotificationChannel(), ensureNotificationPermission(), resolveReminderDate(), resolveWritableCalendarId() (+1 more)

### Community 42 - "Community 42"
Cohesion: 0.33
Nodes (7): NewClientScreen(), useCreateLocalClient(), cleanRut(), formatRut(), hasRut(), isValidRut(), normalizeRut()

### Community 44 - "Community 44"
Cohesion: 0.27
Nodes (5): buildPortablePackage(), buildSchedule(), createAuthHeaders(), importPackage(), request()

### Community 45 - "Community 45"
Cohesion: 0.33
Nodes (8): calculateLateFee(), formatLateFeePercent(), isLateFeeDue(), isPastGracePeriod(), lateFeePolicyDescription(), lateFeePolicyLabel(), resolveLateFeePolicy(), round2()

### Community 46 - "Community 46"
Cohesion: 0.36
Nodes (7): addMonthsClamped(), buildMonthlySchedule(), calculateAmortization(), normalizeFrequency(), splitMonthlySchedule(), buildInstallmentRows(), round2()

### Community 47 - "Community 47"
Cohesion: 0.47
Nodes (6): useLoanHealth(), getFrequencyLabel(), getLoanTypeLabel(), LoanDetail(), SectionLoader(), formatStoredDate()

### Community 48 - "Community 48"
Cohesion: 0.32
Nodes (3): Get-LocalIPv4(), Show-Ready(), Write-Banner()

### Community 49 - "Community 49"
Cohesion: 0.39
Nodes (6): handleQuickCreate(), NewLoanScreen(), resetQuickClient(), useAllClients(), useCreateLocalLoan(), todayDateKey()

### Community 50 - "Community 50"
Cohesion: 0.39
Nodes (3): PortfolioChart(), RevenueChart(), useElementSize()

### Community 51 - "Community 51"
Cohesion: 0.52
Nodes (5): chunkedFrame(), POST(), receiveBody(), renderFrame(), requestedTime()

### Community 54 - "Community 54"
Cohesion: 0.52
Nodes (4): activeLoanCapacity(), getOrganizationEntitlements(), memberCapacity(), getPlanLimits()

### Community 60 - "Community 60"
Cohesion: 0.7
Nodes (4): login(), runTests(), testCreateClient(), testCreateClientWithoutPhone()

### Community 61 - "Community 61"
Cohesion: 0.5
Nodes (3): createCorsOrigin(), isAllowedCorsOrigin(), isPrivateNetworkHost()

### Community 65 - "Community 65"
Cohesion: 0.83
Nodes (3): isLocalHostname(), middleware(), requestHostname()

### Community 72 - "Community 72"
Cohesion: 0.83
Nodes (3): getLoanStatusFromPayments(), registerPaymentTransaction(), toAmount()

## Knowledge Gaps
- **1 isolated node(s):** `BaseHTTPRequestHandler`
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `LoanDetail()` connect `Community 47` to `Community 29`, `Community 28`, `Community 7`, `Community 15`?**
  _High betweenness centrality (0.206) - this node is a cross-community bridge._
- **Why does `getLoanHealth()` connect `Community 15` to `Community 10`, `Community 47`?**
  _High betweenness centrality (0.206) - this node is a cross-community bridge._
- **Why does `differenceInDays()` connect `Community 15` to `Community 0`, `Community 10`, `Community 45`, `Community 21`, `Community 23`, `Community 27`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `useAuth()` (e.g. with `ProtectedRoute()` and `Footer()`) actually correct?**
  _`useAuth()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `useLoans()` (e.g. with `Sidebar()` and `RecentActivity()`) actually correct?**
  _`useLoans()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `createApp()` (e.g. with `createCorsOrigin()` and `createStripeWebhookHandler()`) actually correct?**
  _`createApp()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `formatStoredDate()` (e.g. with `LoanDetail()` and `buildMutuoParagraphs()`) actually correct?**
  _`formatStoredDate()` has 4 INFERRED edges - model-reasoned connections that need verification._
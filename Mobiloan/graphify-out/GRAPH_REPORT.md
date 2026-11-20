# Graph Report - Mobiloan  (2026-09-30)

## Corpus Check
- 36 files · ~135,335 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 147 nodes · 235 edges · 12 communities detected
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f70362b7`
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

## God Nodes (most connected - your core abstractions)
1. `useSession()` - 12 edges
2. `calculateAmortization()` - 9 edges
3. `createCollectionReminder()` - 9 edges
4. `openWhatsApp()` - 9 edges
5. `parseStoredDate()` - 9 edges
6. `formatDate()` - 8 edges
7. `getApiCandidates()` - 7 edges
8. `formatCurrency()` - 7 edges
9. `openPhoneCall()` - 6 edges
10. `toLocalDateKey()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `IndexScreen()` --calls--> `useSession()`  [INFERRED]
  app/index.tsx → src/providers/AppProviders.tsx
- `RootNavigator()` --calls--> `useSession()`  [INFERRED]
  app/_layout.tsx → src/providers/AppProviders.tsx
- `async()` --calls--> `openWhatsApp()`  [INFERRED]
  app/(app)/index.tsx → src/lib/contact.ts
- `async()` --calls--> `formatDate()`  [INFERRED]
  app/(app)/index.tsx → src/lib/format.ts
- `AppLayout()` --calls--> `useSession()`  [INFERRED]
  app/(app)/_layout.tsx → src/providers/AppProviders.tsx

## Communities (19 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (14): async(), handleSync(), NewClientScreen(), useClients(), useCollectionQueue(), usePendingOutbox(), useRejectedOutbox(), useSyncSnapshot() (+6 more)

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (8): derivePaymentStatus(), isPastDue(), isValidDate(), isValidDateInput(), parseDateInput(), todayDateKey(), toLocalDateKey(), toStoredDueDate()

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (7): IndexScreen(), AppLayout(), RootNavigator(), formatDateTime(), AppProviders(), useSession(), isAuthApiError()

### Community 3 - "Community 3"
Cohesion: 0.24
Nodes (11): NewLoanScreen(), useAllClients(), useCreateLocalLoan(), buildMonthlySchedule(), calculateAmortization(), normalizeFrequency(), splitMonthlySchedule(), differenceInDays() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.23
Nodes (10): clone(), defaultState(), derivePaymentStatus(), getStorage(), hydrateOutboxRow(), isPastDue(), loadState(), saveState() (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.26
Nodes (10): buildApiUrl(), getApiCandidates(), normalizeApiUrl(), resolveDefaultApiUrl(), resolveExpoHost(), resolveHostCandidates(), describeAttemptedUrls(), isNetworkError() (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.25
Nodes (10): async(), useClientDetail(), useLoanDetail(), normalizePhone(), openExternalUrl(), openPhoneCall(), openWhatsApp(), formatCurrency() (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.4
Nodes (9): buildReminderNotes(), buildReminderTitle(), createCollectionReminder(), ensureCalendarPermission(), ensureNotificationChannel(), ensureNotificationPermission(), resolveReminderDate(), resolveWritableCalendarId() (+1 more)

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useSession()` connect `Community 2` to `Community 0`, `Community 6`?**
  _High betweenness centrality (0.258) - this node is a cross-community bridge._
- **Why does `parseStoredDate()` connect `Community 3` to `Community 1`?**
  _High betweenness centrality (0.203) - this node is a cross-community bridge._
- **Why does `calculateAmortization()` connect `Community 3` to `Community 1`, `Community 4`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `useSession()` (e.g. with `IndexScreen()` and `RootNavigator()`) actually correct?**
  _`useSession()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `openWhatsApp()` (e.g. with `async()` and `async()`) actually correct?**
  _`openWhatsApp()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `parseStoredDate()` (e.g. with `calculateAmortization()` and `formatDate()`) actually correct?**
  _`parseStoredDate()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
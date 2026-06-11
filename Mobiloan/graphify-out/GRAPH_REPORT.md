# Graph Report - Mobiloan  (2026-06-11)

## Corpus Check
- 24 files · ~125,438 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 83 nodes · 112 edges · 10 communities detected
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.8)
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

## God Nodes (most connected - your core abstractions)
1. `useSession()` - 12 edges
2. `openWhatsApp()` - 9 edges
3. `openPhoneCall()` - 6 edges
4. `MainActivity` - 5 edges
5. `formatCurrency()` - 5 edges
6. `useManualSync()` - 4 edges
7. `formatDate()` - 4 edges
8. `formatDateTime()` - 4 edges
9. `MainApplication` - 3 edges
10. `normalizePhone()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `async()` --calls--> `openWhatsApp()`  [INFERRED]
  app/(app)/loans/[id].tsx → src/lib/contact.ts
- `IndexScreen()` --calls--> `useSession()`  [INFERRED]
  app/index.tsx → src/providers/AppProviders.tsx
- `RootNavigator()` --calls--> `useSession()`  [INFERRED]
  app/_layout.tsx → src/providers/AppProviders.tsx
- `async()` --calls--> `openWhatsApp()`  [INFERRED]
  app/(app)/index.tsx → src/lib/contact.ts
- `AppLayout()` --calls--> `useSession()`  [INFERRED]
  app/(app)/_layout.tsx → src/providers/AppProviders.tsx

## Communities (14 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.21
Nodes (8): useClients(), useCollectionQueue(), usePendingOutbox(), useRejectedOutbox(), useSyncSnapshot(), formatDate(), formatDateTime(), getRelativeDueLabel()

### Community 1 - "Community 1"
Cohesion: 0.2
Nodes (8): useLoanDetail(), useDiscardRejectedMutation(), useManualSync(), useQueuePayment(), useRetryRejectedMutation(), formatCurrency(), async(), handleQueuePayment()

### Community 2 - "Community 2"
Cohesion: 0.25
Nodes (5): IndexScreen(), AppLayout(), RootNavigator(), AppProviders(), useSession()

### Community 4 - "Community 4"
Cohesion: 0.39
Nodes (7): async(), async(), useClientDetail(), normalizePhone(), openExternalUrl(), openPhoneCall(), openWhatsApp()

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useSession()` connect `Community 2` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.188) - this node is a cross-community bridge._
- **Why does `isAuthApiError()` connect `Community 6` to `Community 2`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `openWhatsApp()` connect `Community 4` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `useSession()` (e.g. with `IndexScreen()` and `RootNavigator()`) actually correct?**
  _`useSession()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `openWhatsApp()` (e.g. with `async()` and `async()`) actually correct?**
  _`openWhatsApp()` has 3 INFERRED edges - model-reasoned connections that need verification._
# Graphify Workflow

## Purpose
Use Graphify in this repo to keep the architecture map current and to answer dependency questions quickly while working on the desktop app and the `Mobiloan` mobile workspace.

## Recommended Commands

### Refresh the project graph
```bash
graphify update .
```

Use this after meaningful code changes. It refreshes `graphify-out/` without needing an API key or semantic extraction.

### Keep the graph updated during a longer session
```bash
graphify watch .
```

Use this when touching several files in one sitting.

### Rebuild communities/report only
```bash
graphify cluster-only .
```

Useful when the structure changed enough that you want a fresh report, but do not need a full re-extraction.

### Ask architecture questions
```bash
graphify query "What connects the desktop app to Prisma?"
graphify explain "useLoans()"
graphify path "Desktop App - Electron 33" "Backend - Express 5 + Prisma 5"
```

## Repo Routine
1. Make code changes.
2. Run `graphify update .`
3. Review `graphify-out/GRAPH_REPORT.md` if the change touched architecture.
4. Commit updated graph files together with the code change when they add value.

If the change is mobile-only inside `Mobiloan/`, also review `Mobiloan/graphify-out/README.md` and any mobile graph artifacts you decide to keep with that workspace.

## Beta QA Notes
- After desktop/startup changes, verify both `desktop/main.cjs` and `server/routes/payments.js` still map correctly in `graphify-out/GRAPH_REPORT.md`.
- If routing changes touch `src/App.jsx`, confirm the graph still shows the protected layout flow to:
  - `src/pages/Loans.jsx`
  - `src/pages/NewLoan.jsx`
  - `src/pages/LoanDetail.jsx`
- If date handling changes touch `src/utils/dates.js`, spot-check downstream edges into:
  - `src/components/PaymentScheduleTable.jsx`
  - `src/components/PagareModal.jsx`
  - `src/utils/calendar.js`
  - `src/utils/pagareGenerator.js`

## Latest Verified Changes
- Direct navigation to `#/loans/new` was stabilized by replacing nested route rendering with proper `Outlet`-based protected routing.
- Stored loan/payment dates were normalized through `src/utils/dates.js` so the UI, reminders and legal documents stop drifting by one day.
- Desktop startup was hardened in `desktop/main.cjs` with a longer backend readiness timeout and persistent logs in `%AppData%\\loan-manager\\debug-log.txt`.
- Desktop startup now also defers heavy backend route loads in `server/app.js` and caches successful packaged Prisma migrations in `desktop/main.cjs`, cutting repeated packaged startup to about one second for backend readiness in local validation on `2026-06-02`.
- Desktop external navigation is now intercepted in `desktop/main.cjs` so WhatsApp and other external links open in the system browser instead of Electron's embedded window.
- Payment registration in `server/routes/payments.js` now coerces Prisma `Decimal` values to numbers before summing, preventing corrupted totals after partial + final payments.
- Offline sync backend work is now visible in the graph through `server/routes/sync.js`, `server/utils/paymentTransactions.js`, `server/utils/syncDeletedRecords.js` and the startup compatibility helpers in `server/utils/ensureDatabaseCompatibility.js`.
- The shared root graph now also surfaces `Mobiloan/src/providers/AppProviders.tsx` as the bridge between restored session, offline readiness and automatic sync refreshes.
- The latest root refresh also exposes the new `pending-outbox` path from local SQLite through `usePendingOutbox()` into the mobile portfolio screen.
- The newest refresh also shows `MobileApiError` and `needsReauth` feeding back from the mobile API layer into `AppProviders` and the operational screens.
- The graph now also captures `Mobiloan/src/lib/contact.ts` and the new call/WhatsApp shortcuts wired into client and loan detail flows.
- The latest mobile-facing edges now include urgency labeling through `getRelativeDueLabel()` and the direct contact actions embedded in the collection queue.
- Since `2026-06-15`, the root graph has been refreshed after the latest desktop and mobile beta work.
- The refreshed graph now includes the autonomous-local Mobiloan flows around:
  - `Mobiloan/app/login.tsx`
  - `Mobiloan/app/(app)/new-client.tsx`
  - `Mobiloan/app/(app)/new-loan.tsx`
  - `Mobiloan/app/(app)/calculator.tsx`
  - `Mobiloan/src/lib/amortization.ts`
  - `Mobiloan/src/lib/calendar.ts`
  - `Mobiloan/src/lib/calendar.web.ts`
  - `Mobiloan/src/lib/syncPackage.ts`
- The desktop importer now accepts Mobiloan portable JSON packages through `server/routes/import.js`, `server/middleware/validationSchemas.js`, `src/context/LoanContext.jsx` and `src/pages/ImportData.jsx`.
- Loopback-origin sync QA between Mobiloan web preview and the local desktop backend was stabilized in `server/app.js`, allowing `http://127.0.0.1:19007` and related local QA origins to authenticate and sync cleanly.
- Native collection reminders now bridge calendar plus local notifications through `Mobiloan/src/lib/calendar.ts`, while browser QA intentionally uses `Mobiloan/src/lib/calendar.web.ts` as a platform guard.
- The desktop build artifacts were rebuilt from the current workspace and staged separately for portable and installer testing.

## Last Graph Refresh
- `graphify update .` run successfully on `2026-06-15`.

## Files Worth Keeping
- `graphify-out/GRAPH_REPORT.md`
- `graphify-out/graph.json`
- `graphify-out/graph.html`
- `graphify-out/manifest.json`
- `graphify-out/.graphify_labels.json`

## Files Ignored
The repo ignores Graphify cache and temporary helper artifacts to keep Git history cleaner.

# Graphify Workflow

## Purpose
Use Graphify in this repo to keep the architecture map current and to answer dependency questions quickly while working on the desktop app.

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
- Payment registration in `server/routes/payments.js` now coerces Prisma `Decimal` values to numbers before summing, preventing corrupted totals after partial + final payments.

## Last Graph Refresh
- `graphify update .` run successfully on `2026-06-01`.

## Files Worth Keeping
- `graphify-out/GRAPH_REPORT.md`
- `graphify-out/graph.json`
- `graphify-out/graph.html`
- `graphify-out/manifest.json`
- `graphify-out/.graphify_labels.json`

## Files Ignored
The repo ignores Graphify cache and temporary helper artifacts to keep Git history cleaner.

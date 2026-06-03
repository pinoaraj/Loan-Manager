# GitHub release checklist - desktop beta

Use this checklist when publishing the current Windows desktop beta to GitHub.

## Recommended release title

- `Loan Manager 1.0.0 - Windows Desktop Beta`

## Release summary

- Desktop-first loan management app for Windows
- Electron package with local Express backend and SQLite stored in `AppData`
- Supports clients with `RUT`, loans, partial payments, collections, Excel import/export and legal document generation
- Current status: ready for a controlled Windows beta

## Attachments to include

- `release/LoanManager-Setup-1.0.0.exe`
- `release/win-unpacked/` only if you want an internal portable build for advanced testers
- `docs/BETA-TESTER.md` or its contents adapted into the GitHub release notes

## Pre-publish verification

Run these commands from `C:\Users\JP\Desktop\LoanManager`:

```bash
npm run lint
npx vitest run
cd server && npm test
cd ..
npm run build
npm run rebuild-desktop
graphify update .
```

Confirm all of the following before publishing:

- Login works on a clean local database
- First-user registration works on a clean install
- Client create/edit/search works with `RUT`
- Loan creation and detail views load correctly
- Partial payment plus final payment closes the installment exactly
- Collections deep-link opens the correct pending `paymentId`
- `Pagare`, `Mutuo`, `Contrato PDF`, `Word` and `Calendario` exports open correctly
- Import/export works with representative data
- `release/win-unpacked/Loan Manager.exe` starts and `/api/health` returns `200`

Latest local verification on `2026-06-03`:

- `npm run lint`: OK
- `npx vitest run src/pages/LoanDetail.test.jsx`: OK
- `cd server && npm test`: OK
- `npm run build`: OK
- `npm run rebuild-desktop`: OK
- Manual smoke test: `release/win-unpacked/Loan Manager.exe` exposed `GET http://127.0.0.1:3011/api/health` successfully and Electron logged `Server healthcheck passed` at `2026-06-03T13:52:03Z`

## Suggested GitHub release notes

```md
## Windows desktop beta

This release is the current controlled beta for Loan Manager on Windows.

### Included

- Electron desktop app with local backend and SQLite persistence
- Client management with `RUT`, phone, email and address
- Loan creation and detail flows
- Partial payments with transaction history
- Collections and upcoming-payment views with direct deep-links
- Excel import/export
- Legal document generation for pagare and mutuo

### Validation status

- `npm run lint`: OK
- `npx vitest run src/pages/LoanDetail.test.jsx`: OK
- `cd server && npm test`: OK
- `npm run build`: OK
- `npm run rebuild-desktop`: OK
- `release/win-unpacked/Loan Manager.exe` smoke test on June 3, 2026: OK

### Known watch items

- Final legal document formatting should keep being reviewed with real customer data
- Desktop smoke testing is still recommended on more than one Windows machine
- Bundle size remains heavier than ideal due to PDF/XLSX/charting dependencies
```

## Scope freeze for this beta

Do not expand product scope before collecting tester feedback on:

- install flow
- first login and registration
- payments and collections
- legal document output
- import/export reliability

## Next milestone after publish

1. Collect feedback from Windows beta testers.
2. Triage bugs by severity and reproducibility.
3. Freeze the desktop beta scope.
4. Start the Android planning track already outlined in `docs/PLAN-android-app.md`.

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
- `release/win-unpacked/` zipped, only if you want an internal portable build for advanced testers
- `docs/BETA-TESTER.md` or its contents adapted into the GitHub release notes
- The ready-to-share package on Desktop: `C:\Users\JP\Desktop\LoanManager-Beta-1.0.0` (installer + portable + `LEEME-INSTALACION.txt`)

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
- The packaged folder contains no `*.db`, no `.env`, no `tests/` and no logs
- The app starts when it is installed in a path with spaces such as `C:\Program Files\Loan Manager`
- Server logs end up in `%AppData%\loan-manager\logs` instead of the install folder
- Client create/edit/search works with `RUT`
- Loan creation and detail views load correctly
- Partial payment plus final payment closes the installment exactly
- Loan detail still lists the payment transaction history after a late fee is applied
- Collections deep-link opens the correct pending `paymentId`
- `Pagare`, `Mutuo`, `Contrato PDF`, `Word` and `Calendario` exports open correctly
- Import/export works with representative data
- `release/win-unpacked/Loan Manager.exe` starts and `/api/health` returns `200`

Latest local verification refresh on `2026-06-16`:

- `npm run lint`: OK
- `npx vitest run`: OK
- `cd server && npm test`: OK
- `npm run build`: OK
- `npm run rebuild-desktop`: OK
- `npm run build:desktop-installer`: OK
- Current release artifacts rebuilt on `2026-06-16`: OK
  - `release/win-unpacked/Loan Manager.exe`
  - `release/LoanManager-Setup-1.0.0.exe`

Verification refresh on `2026-09-30` (desktop clean install fix):

- `npx vitest run`: OK (11/11)
- `cd server && npm test`: OK (12/12)
- `npm run build:desktop-installer`: OK
- Release artifacts rebuilt on `2026-09-30`: `release/win-unpacked/Loan Manager.exe` and `release/LoanManager-Setup-1.0.0.exe`
- Installer installed to `C:\Program Files\Loan Manager`; the app started, applied the 6 migrations and answered `GET /api/health` with `200`
- `POST /api/auth/register` returned `201` and `POST /api/auth/login` returned `200` on a clean database, so first-user registration works on a fresh install
- Packaged server verified to contain no `*.db`, no `.env`, no `tests/` and no logs
- Portable copy tested from the Desktop beta package: started, migrated and registered the first user

Latest packaged smoke history:

- Manual smoke test: `release/win-unpacked/Loan Manager.exe` exposed `GET http://127.0.0.1:3011/api/health` successfully and Electron logged `Server healthcheck passed` at `2026-06-03T13:52:03Z`
- Installer smoke test: `release/LoanManager-Setup-1.0.0.exe` installed successfully in silent mode to a temporary folder and the installed `Loan Manager.exe` logged `Server healthcheck passed` at `2026-06-03T14:44:55Z`

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
- `npx vitest run`: OK
- `cd server && npm test`: OK
- `npm run build`: OK
- `npm run rebuild-desktop`: OK
- `npm run build:desktop-installer`: OK
- Current release artifacts rebuilt on `2026-09-30`: OK
- Clean install verified on September 30, 2026 on a real Windows machine installed in `C:\Program Files\Loan Manager`: startup, migrations, first-user registration and login OK
- Portable build smoke test on September 30, 2026: OK

### Fixes in this build

- The installer no longer ships a seeded SQLite database or `.env`, so a clean install starts empty and allows creating the first user
- The database file is created empty before running `prisma migrate deploy`, because the Prisma schema engine fails on Windows when the SQLite file does not exist yet
- Packaged migrations run the Prisma CLI through Electron's own Node runtime instead of `cmd.exe`, so the app also starts when installed under a path with spaces
- Backend logs are written to `%AppData%\loan-manager\logs` with a temp-folder fallback, because a normal user cannot create folders inside `C:\Program Files\Loan Manager`

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

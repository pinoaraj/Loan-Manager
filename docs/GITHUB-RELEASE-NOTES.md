# Loan Manager 1.0.0 - Windows Desktop Beta

Build published: `2026-09-30`

## Windows desktop beta

This release is the current controlled beta for Loan Manager on Windows.

### Included

- Electron desktop app with local backend and SQLite persistence in `AppData`
- Client management with `RUT`, phone, email and address
- Loan creation and loan detail flows
- Partial payments with transaction history
- Collections and upcoming-payment views with direct deep-links into the exact pending installment
- Excel import/export
- Legal document generation for pagare, mutuo, PDF contract, Word contract and payment calendar

### Validation status

- `npm run lint`: OK
- `npx vitest run`: OK
- `cd server && npm test`: OK
- `npm run build`: OK
- `npm run rebuild-desktop`: OK
- `npm run build:desktop-installer`: OK
- Release artifacts rebuilt on `2026-09-30`: `release/win-unpacked/Loan Manager.exe` and `release/LoanManager-Setup-1.0.0.exe`
- Installer installed on `2026-09-30` in `C:\Program Files\Loan Manager`; the app started, applied all migrations and answered `GET /api/health` with `200`
- First-user flow verified on a clean database on `2026-09-30`: `POST /api/auth/register` returned `201` and `POST /api/auth/login` returned `200`
- Portable package on Desktop (`LoanManager-Beta-1.0.0`) checked on `2026-09-30`: starts, migrates and registers the first user

### Notable beta improvements

- Clean installs no longer ship a seeded SQLite database or `.env`; the first user can always be created on a new machine
- Packaged startup creates the empty SQLite file before migrating and runs the Prisma CLI through Electron's Node runtime, so installs under paths with spaces (`C:\Program Files\Loan Manager`) start correctly
- Backend logs are written to `%AppData%\loan-manager\logs` instead of the installation folder
- Packaged desktop startup now reuses a cached successful Prisma migration state on repeated launches
- Packaged backend route loading was deferred to reduce startup cost
- WhatsApp and other external links now open in the system browser instead of Electron's embedded Chromium
- Collections deep-links open the correct `paymentId` and the payment modal closes cleanly on the first click
- Date handling was normalized across loan detail, collections, reminders and legal documents

### Known watch items

- Final legal document formatting should keep being reviewed with real customer data
- Desktop smoke testing is still recommended on more than one Windows machine
- Bundle size remains heavier than ideal due to PDF/XLSX/charting dependencies

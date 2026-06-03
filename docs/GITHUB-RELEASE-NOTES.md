# Loan Manager 1.0.0 - Windows Desktop Beta

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
- `npx vitest run src/pages/LoanDetail.test.jsx`: OK
- `cd server && npm test`: OK
- `npm run build`: OK
- `npm run rebuild-desktop`: OK
- Packaged smoke test on `2026-06-03`: `release/win-unpacked/Loan Manager.exe` started successfully and the local backend answered `GET /api/health` with `200`

### Notable beta improvements

- Packaged desktop startup now reuses a cached successful Prisma migration state on repeated launches
- Packaged backend route loading was deferred to reduce startup cost
- WhatsApp and other external links now open in the system browser instead of Electron's embedded Chromium
- Collections deep-links open the correct `paymentId` and the payment modal closes cleanly on the first click
- Date handling was normalized across loan detail, collections, reminders and legal documents

### Known watch items

- Final legal document formatting should keep being reviewed with real customer data
- Desktop smoke testing is still recommended on more than one Windows machine
- Bundle size remains heavier than ideal due to PDF/XLSX/charting dependencies

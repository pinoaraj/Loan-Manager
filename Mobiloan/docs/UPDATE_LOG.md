# Update Log

## 2026-11-13

### 1.2.10

- Bumped the app to `1.2.10` (`versionCode 13`) and rebuilt the standalone release APK as `dist/mobiloan-beta-1.2.10.apk` (65,88 MB, SHA256 `939CD6E1D9C28AA1BB15D7BC8C8335F5B7DACF8B313EF4F0B4760EEBC556A331`).
- Loan detail now renders the full installment table: `src/lib/schedule.ts` builds `buildInstallmentRows` on the client (no database migration) from `calculateAmortization`, scaling the split to the stored amount. Each row shows number, due date, status chip (`PAGADA`/`PARCIAL`/`VENCIDA`/`PENDIENTE`), amount, running balance, `Cap · Int`, and the transactions registered against that installment.
- Partial payments are visible: the row keeps the `PARCIAL` chip, shows a progress bar and `Pagado $X · Restan $Y`, and lists `fecha · metodo · monto` with an `Enviar comprobante` action on the selected row.
- Selecting a fully paid installment no longer shows "Saldo pendiente: $0"; it now reads `Cuota ... ya esta pagada por completo`.
- Loan detail, client detail, new loan, new client and the calculator now use a two-column layout when the window is at least 720 dp wide, matching the desktop: detail (`Contacto/Stats/Documentos/Administrar` | `Registrar pago/Cuotas`), new loan (`formulario` | `vista previa`), client (`Ficha` | `Prestamos/Zona de riesgo`), `Ajustes > Datos` (`Respaldo` | `Reportes`).
- Fixed wide-mode regressions: the four `Inicio` KPIs were squeezed into half a column (moved to a full-width row above `dashGrid`) and the sidebar was drawn under the status bar (now uses `useSafeAreaInsets`).
- KPI cards on wide screens now share the row evenly (`flexBasis: 0`) and their hints stay on one line, so the four cards never wrap unevenly.
- The sidebar layout reserves the bottom gesture inset (`sceneStyle.paddingBottom`), and the stack detail screens reserve it through `contentStyle.paddingBottom`, so the navigation handle no longer covers the last card.
- `Cartera` hides the floating `+` in wide mode: it overlapped the full-width `+ Nuevo prestamo` button and duplicated it.
- `Analisis > Proyeccion` caps each bar at 150 dp and, on wide screens, splits into chart (left) and exact monthly amounts (right).
- Calculator amortization table now includes the `Saldo` column with the running balance (`$574.018 → ... → $0`) and fills the card width on tablets. On phones each installment is a stacked row (`1 · 13-12-2026`, `$114.804`, `Cap · Int · Saldo`) instead of a horizontally scrolling table.
- `Analisis` KPI pills were fixed (they rendered as empty pills because `KpiCard` had no width style) and the monthly goal now shows the real ratio (`144%`) while the bar caps at 100%.
- `app.json` unlocks rotation (`orientation: "default"`) so the phone can use the sidebar layout in landscape.
- Verified on `MobiloanApi35` in portrait (1080x2400 @420), landscape (914 dp) and tablet size (1600x2560 @240): every tab, all `Analisis`/`Ajustes` segments, loan detail with a partial payment, client detail (view + edit), new loan, new client and the calculator.

### 1.2.9

- Bumped the app to `1.2.9` (`versionCode 12`) and rebuilt the standalone release APK as `dist/mobiloan-beta-1.2.9.apk` (65,87 MB, SHA256 `E1F87F407436CF92ECC804DA58D22BC76795EF28AABA1FCCA602D06EA25FE6F8`).
- Fixed the real-phone report about stacked KPIs: `Inicio` no longer uses a horizontal `ScrollView` with fixed-width cards. The four KPIs now live in a `flexWrap` grid — 2x2 on phones (`kpiCardHalf`, `flexBasis: 47%`) and a single four-card row on wide screens (`kpiCardWide`, `flex: 1`) — so they can never pile up vertically.
- Added `src/lib/labels.ts` with `frequencyLabel`, `loanTypeLabel`, `paymentStatusLabel`, `paymentMethodLabel` and `loanStatusLabel`, and applied it in loan detail, client detail, `Cartera`, `Ajustes` and the PDF/CSV reports. Internal values (`Cash`, `Fixed`, `monthly`, `Pending`, ...) are still stored as-is; only the presentation is translated.
- Loan detail header now reads `Cliente · Cuota fija · Mensual` instead of `Fixed - monthly`; installment status and payment method are localized too.
- Payment flow: added a 1-peso tolerance and `Math.min(parsedAmount, remaining)` so a full payment closes the installment at exactly `$0` instead of leaving a `$1` balance from rounding. Selecting an installment prefills the amount with `Math.round(remaining)` and the remaining balance is recalculated after saving.
- Removed the "sincroniza cuando haya red" line from loan detail: the app is local-first, so the copy now reads `Selecciona una cuota, escribe el monto y guarda el pago.`
- `Inicio` hints now handle the empty/partial cases: `Sin cuotas programadas`, `Sin cuotas este mes`, `Sin meta`, and singular/plural for `1 prestamo activo` / `N prestamos activos`.
- `Cobranza` auto-selects `Proximas` on first open when there is nothing overdue but there are upcoming installments.
- Black-box pass on a clean install (`pm clear`): local login, client, loan, full payment, partial payment, all five tabs and the `Ajustes` sub-tabs (`App | Datos | Sync`) verified on `MobiloanApi35`.

### 1.2.8

- Bumped the app to `1.2.8` (`versionCode 11`); superseded by `1.2.9` before distribution.

### 1.2.7

- Bumped the app to `1.2.7` (`versionCode 10`) and rebuilt the standalone release APK as `dist/mobiloan-beta-1.2.7.apk`.
- Fixed text that did not fit its container (the "Calculado ra" case in the quick actions): labels, values, chips and buttons now shrink or auto-fit instead of breaking mid-word.
- `QuickAction` and `SegmentedControl` now auto-fit their text, so the four quick actions stay in a single row on narrow phones.
- Calculator was rebuilt to match the desktop simulator: hero header, parameters card, validation message, dark estimated-installment card, plan information block and a horizontally scrollable amortization table.
- `Inicio` KPIs now use colored icon badges with uppercase labels, matching the desktop KPI cards; priority collections cap their amount column so the client name keeps room.
- `Cobranza` summary cards, filter chips and collection rows auto-fit their amounts; `Cartera` loan/client rows truncate names and keep the health chip readable.
- `Analisis` summary cards, portfolio status, PAR, monthly goal, projection chart labels and activity rows were adjusted to avoid overflow.
- Loan detail hero, stat grid and installment rows auto-fit amounts; client detail hero and the "Nuevo prestamo" button do too.
- `new-loan` client selector and the create button auto-fit long client names.
- Shared styles (`styles.ts`) gained `flexShrink`/`minWidth: 0` on rows, uppercase `summaryLabel`/`statLabel`, and a `flexBasis`-based `statBox`, so two-column grids keep working on small screens.

## 2026-11-11

### 1.2.6

- Bumped the app to `1.2.6` (`versionCode 9`) and rebuilt the standalone release APK as `dist/mobiloan-beta-1.2.6.apk`.
- Navigation is now adaptive: bottom tab bar on phones and a permanent left sidebar (`tabBarPosition: 'left'`, `tabBarVariant: 'material'`) when the window is at least 720 dp wide, so tablets and landscape phones use the horizontal space instead of stacking content.
- Fixed the missing `portfolio` screen registration in `(tabs)/_layout.tsx`; all five tabs (`Inicio`, `Cobranza`, `Cartera`, `Analisis`, `Ajustes`) are declared explicitly.
- `Inicio` was rebuilt as a compact dashboard: 4 KPIs, one overdue alert, up to 3 priority collections (4 on wide screens), a 4-action quick row and two shortcuts to `Cartera`/`Analisis`. The long "En curso" and "Ultimos pagos" lists were removed from the home screen.
- On wide screens `Inicio` lays out in two columns (`dashGrid`/`dashColumn`) to shorten vertical scroll.
- `Analisis` is split into `Resumen | Proyeccion | Actividad` segments, and `Ajustes` into `App | Datos | Sync`; in local mode the `Sync` segment only explains that the app does not need the PC.
- Tab content is capped at `maxWidth: 1180` and centered, so wide layouts stay readable.
- Added `QuickAction` and extended `src/ui/styles.ts` with the quick-row, dashboard-grid, shortcut and segment styles.

### 1.2.5

- Bumped the app to `1.2.5` (`versionCode 8`) and rebuilt the standalone release APK as `dist/mobiloan-beta-1.2.5.apk`.
- The app now uses a real mobile navigation shell: a bottom tab bar with `Inicio`, `Cobranza`, `Cartera`, `Analisis` and `Ajustes`, so no screen is an endless vertical scroll anymore.
- `Inicio` is now a compact dashboard: 4 KPIs, one overdue alert, up to 3 priority collections (WhatsApp + calendar + open installment), a 2x2 quick-actions grid, up to 3 active loans and the last 3 payments, each section linking to its full tab.
- `Cobranza` was rebuilt as a virtualized `FlatList` with sticky-style header, search, filter chips with counters, overdue/upcoming summaries and pull-to-refresh.
- `Cartera` unifies loans and clients behind a segmented control, with search, loan status filters, per-row loan health, a create button and a floating action button.
- New `Analisis` tab: lent/outstanding/collected summary, portfolio status bar with paid/outstanding/overdue split and PAR, monthly collection goal progress, 6-month projection chart, health KPIs, CSV export and recent activity.
- Detail screens (`new-client`, `new-loan`, `calculator`, `clients/[id]`, `loans/[id]`) stay on the stack above the tabs; the old `Prestamos` list screen was removed because `Cartera` replaces it.
- Added `@expo/vector-icons` for tab and action iconography, plus shared UI primitives (`TabHeader`, `KpiCard`, `ActionTile`, `SectionHeader`, `ProgressBar`, `SegmentedControl`, `EmptyState`).

## 2026-11-10

### 1.2.4

- Bumped the app to `1.2.4` (`versionCode 7`) and rebuilt the standalone release APK as `dist/mobiloan-beta-1.2.4.apk`.
- The home screen now mirrors the desktop dashboard: desktop-style KPIs (`Total prestado` with risk amount, `Cobranza mensual` with monthly goal progress, `Clientes activos`, `Salud de cartera`), a portfolio status bar, payment alerts, a 6-month collection projection chart, recent activity and active loans.
- Payment alerts on the home screen and in `Cobranza` now prefill the WhatsApp message with the same reminder text used by the desktop (overdue notice or upcoming reminder, including the installment number when available).
- `Cobranza` gained the desktop summary cards (`Total vencido` and `Proximos cobros (30 dias)`) plus per-filter counters.
- Loan detail can now send a payment receipt over WhatsApp for any registered transaction, using the desktop receipt text.
- Added `Exportar cartera (CSV)` in `Ajustes`, which shares the full portfolio as a semicolon-separated CSV (Excel-friendly, UTF-8 BOM).
- Added local dashboard stats `monthlyCollection`, `expectedCollection` and `parAmount`, computed from the device database.

### 1.2.3

- Bumped the app to `1.2.3` (`versionCode 6`) and rebuilt the standalone release APK as `dist/mobiloan-beta-1.2.3.apk`.
- The app version is now visible on the login screen and in `Ajustes`, so beta testers can confirm which build is installed instead of judging by the UI alone.
- The install page now serves the new APK; the previous `1.2.1` page was still the reason the redesigned home was not visible on the phone.
- `1.2.2` (`versionCode 5`) contained the redesign below but was never linked from the install page.

### 1.2.2

- Bumped the app to `1.2.2` (`versionCode 5`) and rebuilt the standalone release APK as `dist/mobiloan-beta-1.2.2.apk`.
- Removed the nested `(app)` route header: the root stack now runs with `headerShown: false`, so each screen shows only its own title.
- Replaced the home screen: sync/outbox cards are gone and the local portfolio now shows KPIs (capital prestado, por cobrar, cobrado, salud), overdue alerts, quick actions, active loans and clients.
- Moved sync, pending/rejected outbox, backup export and portable import into `Ajustes`.
- Added `Cobranza` (overdue/today/upcoming filters, search, call, WhatsApp, calendar) and `Prestamos` (search, status filter, loan health).
- Loan detail gained health chip, pause/resume, recalculate, contract PDF, promissory note PDF, schedule CSV and delete.
- Client detail gained inline edit and delete for locally created clients.
- Regenerated the install page and QR as `dist/index.html` / `dist/install-qr-beta-1.2.2.png`.

### 1.2.1

- Reworked the entry screen so the independent mode is the primary action (`Entrar sin PC ni internet`) and desktop sync is presented as an optional section with its own explanation.
- Hid the sync cursor, pending outbox and rejected outbox cards while the app runs in local mode; the local portfolio now shows payments and registered collections instead of backend queue counters.
- Adjusted local-mode copy (hero, empty states, export button) so the app no longer suggests that the desktop or internet is required.
- Bumped the app to `1.2.1` (`versionCode 4`) and rebuilt the release APK as `dist/mobiloan-beta-1.2.1.apk`.
- Regenerated the install QR as `dist/install-qr-beta-1.2.1.png`.

### 1.2.0

- Fixed a data-loss path: a remote login/bootstrap used to wipe the portfolio created on the phone. Records now carry an `origin` flag (`local` or `server`); bootstrap replaces only `server` rows and keeps everything created in the field.
- Added a one-time migration for installs that predate the `origin` column: rows whose ids use the app prefixes (`client_`, `loan_`, `payment_`, `local_`) are reclassified as `local` instead of being treated as backend copies.
- Logout now clears the backend copy, the pending outbox and the sync cursors without deleting the local portfolio, so the next account starts from a clean bootstrap.
- Fixed month-end due dates in all three amortization engines (mobile, backend, desktop frontend): `setMonth` overflowed 31 January into 3 March; dates are now clamped to the last day of the target month and anchored at local noon.
- Added a regression test for month-end schedules (`src/utils/amortization.test.js`), now 5 tests.
- Bumped the app to `1.2.0` (`versionCode 3`) and rebuilt the release APK as `dist/mobiloan-beta-1.2.0.apk` with `EXPO_PUBLIC_API_URL=http://192.168.4.81:3011/api`.
- Added the install QR `dist/install-qr-beta-1.2.0.png` for LAN download from the PC.

## 2026-10-01

- Found and fixed a beta-blocking gap: the native project did not declare `READ_CALENDAR` or `WRITE_CALENDAR`, so `expo-calendar` could never get calendar permission on the phone and every collection reminder failed silently on Android.
- Re-ran `expo prebuild --platform android` so `app.json` (calendar permissions plus the `expo-calendar` plugin) is now reflected in `android/app/src/main/AndroidManifest.xml`.
- Bumped the app to `1.1.0` (`versionCode 2`) so beta testers can tell this build apart from the previous `1.0.0` APK.
- Rebuilt the release APK from the current workspace with `EXPO_PUBLIC_API_URL=http://192.168.4.81:3011/api` and published the delivery copy as `dist/mobiloan-beta-1.1.0.apk`.
- Added the install QR `dist/install-qr-beta-1.1.0.png` plus a tiny LAN HTTP server flow so the phone can download the APK over Wi-Fi.

## 2026-09-30

- Added `scripts/build-android-release.ps1` plus `npm run android:release`, which builds the release APK with the production JS profile and refuses to finish if the APK has no embedded `assets/index.android.bundle`.
- Fixed `scripts/install-android-beta.ps1` so it prefers the release APK and now blocks the debug APK by default, because the debug variant ships without a bundle and only runs while Metro is serving from the PC.
- Verified that the previous `app-release.apk` from `2026-06-08` had an embedded bundle but did not contain the autonomous local mode, the local calculator or the portable export, and that the newer `app-debug.apk` from `2026-07-01` had no bundle at all.
- Regenerated the release APK from the current workspace so the phone instalment can run the local mode without a PC or a backend.

## 2026-06-19

- Fixed the Android debug build script so it compiles through a short temporary Windows junction, avoiding native path-length failures during CMake and codegen tasks.
- Exported `NODE_ENV=development` from the Android debug build helper so Expo env loading stays explicit during local packaging.

## 2026-06-15

- Added a fully autonomous local entry path so Mobiloan can operate on Android without the desktop backend running.
- Added local client creation and local loan creation flows backed by the device database.
- Added an in-app loan calculator and local amortization schedule generation.
- Added native calendar reminder creation for collection follow-ups.
- Extended collection reminders so Android/iOS now schedule both a calendar event and a local notification.
- Added portable local export packaging for later desktop intake or optional synchronization.
- Added desktop-side portable JSON intake so Loan Manager can import Mobiloan local exports through the existing import screen.
- Aligned the Mobiloan workspace with the expected Expo SDK 56 package patch versions and added `react-native-web` so dependency validation now passes cleanly.
- Added a web-specific local database adapter backed by `localStorage`, allowing the app to boot and operate in browser QA without importing `expo-sqlite` web wasm at startup.
- Added a web fallback for session persistence so browser boot no longer fails on `expo-secure-store`.
- Fixed local QA sync login by allowing loopback web preview origins in the desktop backend CORS policy.
- Completed a comparative smoke pass over key Mobiloan tabs: portfolio, calculator, new client, new loan and loan detail.
- Cleaned the client detail copy to remove corrupted separator characters in the operational UI.

## 2026-06-11

- The collection queue now deep-links to the exact installment inside loan detail instead of only opening the parent loan.
- Rejected outbox entries now show local client and installment context plus a direct `Abrir cuota` action for faster reconciliation.
- Mobiloan now attempts an automatic background sync when a saved session is restored and when the app returns to foreground.
- Concurrent sync attempts are now deduplicated so manual and automatic refreshes do not race each other.
- The login and operational screens now expose explicit offline state, last sync time and whether the local portfolio is usable without internet.
- Registering a payment no longer looks failed just because immediate sync failed; the app now preserves the offline save and reports sync as a separate follow-up step.
- Added a dedicated pending outbox view so field collection can inspect unsent payments before they become rejects.
- Sync/auth failures now surface an explicit reauthentication state instead of looking like silent generic sync errors.
- Added direct call and WhatsApp shortcuts from client and loan detail screens to support field collection workflows.
- The collection queue now includes urgency labels plus direct call, WhatsApp and `Abrir cuota` actions from the main portfolio screen.

## 2026-06-09

- Added incremental deletion support so `Mobiloan` now removes locally deleted clients and replaced payment schedules using `deletedIds` from `sync/changes`.
- Blocked offline queueing for already closed installments and for payment amounts above the remaining balance.
- Added a dedicated smoke guide in `docs/SYNC_SMOKE.md` for bootstrap, deletions, recalculation replacement and rejection reconciliation.

## 2026-06-04

- Fixed Android login connectivity for LAN testing by creating `Mobiloan/.env` with `EXPO_PUBLIC_API_URL=http://192.168.4.81:3011/api`.
- Rebuilt the Android release APK so phone login no longer targets `127.0.0.1`.
- Enabled Android cleartext traffic for local `http://` backend access and rebuilt the release APK served by the install QR.

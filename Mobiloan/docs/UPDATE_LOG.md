# Update Log

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

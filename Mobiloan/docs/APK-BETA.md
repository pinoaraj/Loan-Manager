# APK beta de Mobiloan

## Artefacto actual

| Campo | Valor |
|---|---|
| Archivo | `android/app/build/outputs/apk/release/app-release.apk` |
| Copia de entrega | `dist/mobiloan-beta-1.1.0.apk` |
| Version | `1.1.0` (`versionCode 2`) |
| Paquete | `com.mobiloan.app` |
| Tamano | 63,4 MB |
| Fecha de build | 2026-10-01 |
| Bundle JS embebido | Si (`assets/index.android.bundle`) |
| Arquitecturas | `arm64-v8a`, `x86_64` |
| Firma | Clave de desarrollo (`CN=Android Debug`) |
| SHA256 | `FE381A6BC74DBE251C63E6F0130BA7626C9294701A0CC8BE7B6195B29DFCC52C` |

Permisos declarados en el manifiesto: `INTERNET`, `READ_CALENDAR`, `WRITE_CALENDAR`, `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `ACCESS_NETWORK_STATE`.

## Como se genera

```bash
npm run android:release
```

Para hornear una IP LAN distinta sin editar `.env`:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/build-android-release.ps1 -ApiUrl "http://192.168.1.50:3011/api"
```

El script `scripts/build-android-release.ps1`:

1. fija `NODE_ENV=production`,
2. compila `assembleRelease` a traves del junction corto `C:\mob`,
3. falla si el APK no trae `assets/index.android.bundle`,
4. imprime tamano y `sha256` del artefacto.

## Como se instala

```bash
npm run android:install
```

`scripts/install-android-beta.ps1` prioriza el APK release y rechaza el debug sin bundle salvo que se pase `-AllowDebug`.

Tambien se puede copiar `app-release.apk` al telefono y abrirlo directamente. Guia para testers: `docs/INSTALACION-APK-BETA.md`.

## Historial de artefactos

| Artefacto | Fecha | Bundle | Estado |
|---|---|---|---|
| `app-release.apk` | 2026-06-08 | Si, sin modo local | Obsoleto: no incluye modo local, calculadora ni export portable |
| `app-debug.apk` | 2026-07-01 | No | Solo desarrollo: requiere Metro en el PC |
| `app-release.apk` `1.0.0` | 2026-09-30 | Si, con modo local | Obsoleto: sin permisos de calendario, los recordatorios fallaban |
| `app-release.apk` `1.1.0` | 2026-10-01 | Si, con modo local | Beta vigente para instalar en el celular |

## Pendientes antes de publicar en tienda

- Generar keystore propio y firmar el release con esa clave.
- Subir `versionCode`/`versionName` en cada entrega.
- Smoke test en dispositivo fisico registrado (permisos de calendario, notificacion y export).
- Decidir si la distribucion sigue siendo APK directa o pasa a Play Store interna.

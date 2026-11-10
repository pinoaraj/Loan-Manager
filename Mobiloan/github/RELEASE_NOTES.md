# Mobiloan Release Notes

## 1.1.0-beta - APK standalone corregido

| Campo | Valor |
|---|---|
| Archivo | `android/app/build/outputs/apk/release/app-release.apk` |
| Copia de entrega | `dist/mobiloan-beta-1.1.0.apk` |
| QR de instalacion | `dist/install-qr-beta-1.1.0.png` |
| Version | `1.1.0` (`versionCode 2`) |
| Paquete | `com.mobiloan.app` |
| Build | `2026-10-01` |
| Tamano | 63,4 MB |
| Bundle JS | Embebido (`assets/index.android.bundle`) |
| Arquitecturas | `arm64-v8a`, `x86_64` |
| SHA256 | `FE381A6BC74DBE251C63E6F0130BA7626C9294701A0CC8BE7B6195B29DFCC52C` |

Cambios respecto de `1.0.0-beta.1`:

- `READ_CALENDAR`, `WRITE_CALENDAR`, `POST_NOTIFICATIONS` y `SCHEDULE_EXACT_ALARM` quedaron declarados en el manifiesto, asi que los recordatorios de cobranza ya pueden pedir permiso y agendarse en el telefono.
- Fechas de cuota tratadas como fecha calendario (ancla a mediodia local) en `src/lib/dates.ts`, evitando que las cuotas se muestren corridas un dia en Chile.
- Los clientes, prestamos y cuotas creados en el telefono se marcan `origin = 'local'`, por lo que un bootstrap remoto ya no borra la cartera levantada en terreno.
- Los pagos de cuotas locales ya no se encolan contra el backend (antes generaban un rechazo permanente); viajan al desktop por el paquete portable.
- Filtros de cobranza (`vencidas`, `hoy`, `proximas`) calculados en hora local en vez de UTC.
- Validacion de monto, tasa, plazo y fecha antes de crear un prestamo, tanto en pantalla como en la capa de datos.
- Mensajes de permisos denegados de calendario y notificaciones ahora indican la ruta en Ajustes de Android.

## 1.0.0-beta.1 - APK standalone para celular

Artefacto de beta para instalar directo en el telefono, sin PC y sin backend:

| Campo | Valor |
|---|---|
| Archivo | `app-release.apk` (`Mobiloan-Beta-1.0.0.apk` en el paquete de entrega) |
| Version | `1.0.0` (`versionCode 1`) |
| Paquete | `com.mobiloan.app` |
| Build | `2026-09-30` |
| Tamano | 63,4 MB |
| Bundle JS | Embebido (`assets/index.android.bundle`, 2,69 MB) |
| Arquitecturas | `arm64-v8a`, `x86_64` |
| SHA256 | `0E32A30CD3D8F3A17E1BCAC5AEB539E9EE1AF7AFD4666B7E0F824EF18B07CA26` |

Incluye:

- modo local autonomo (`Entrar en modo local`) sin backend ni internet,
- alta local de clientes y prestamos sobre SQLite del telefono,
- calculadora y tabla de amortizacion local,
- recordatorios de cobranza en calendario nativo con notificacion local,
- atajos de llamada y WhatsApp,
- exportacion del paquete portable JSON para intake en Loan Manager desktop.

Build y verificacion:

```bash
npm run android:release
npm run android:install
```

Notas de esta entrega:

- `npm run android:release` valida que el APK lleve bundle JS embebido antes de considerarse utilizable.
- `npm run android:install` instala el release por defecto y bloquea el debug sin bundle salvo `-AllowDebug`.
- El APK sigue firmado con la clave de desarrollo: sirve para beta directa, no para Play Store.
- Pendiente: smoke test en dispositivo fisico y keystore propio antes de distribucion amplia.

## Working Draft

### 0.1.0 - Offline Foundation

- Expo workspace creado para Mobiloan
- Login con token seguro
- Base local SQLite para cartera y outbox
- Entrada alternativa en modo local sin backend
- Alta local de clientes y prestamos
- Calculadora de prestamos integrada
- Generacion local de tabla de amortizacion
- Recordatorios de cobranza en calendario nativo
- Recordatorios nativos reforzados con notificacion local en Android/iOS
- Exportacion portable local para ingestion o sync posterior con desktop
- Importacion en desktop del paquete portable JSON generado por Mobiloan
- Sync inicial contra backend de Loan Manager
- Pantallas base para cartera, cliente y prestamo
- Panel de reconciliacion para mutaciones rechazadas
- Guia inicial de prueba Android con backend LAN
- Proyecto nativo Android generado con Expo prebuild
- Perfil `preview` APK preparado en `eas.json`
- Filtros de cobranza offline: vencidas, hoy y proximas
- APK debug local generado en `android/app/build/outputs/apk/debug/app-debug.apk`
- APK release LAN generado en `android/app/build/outputs/apk/release/app-release.apk`
- Build Android corregido para usar `EXPO_PUBLIC_API_URL=http://192.168.4.81:3011/api`
- QR local de instalacion sirviendo `app-release.apk`
- Soporte incremental para `deletedIds` en `sync/changes`
- Limpieza local de clientes borrados y cuotas reemplazadas por recalculo
- Prevencion local de sobrepago y de cuotas ya cerradas antes de crear outbox
- Deep-link desde cola de cobranza y reconciliacion hacia la cuota exacta dentro del detalle del prestamo
- Rechazos de outbox con contexto local de cliente, vencimiento y saldo pendiente
- Auto-sync al restaurar sesion y al volver la app al foreground
- Dedupe de sincronizaciones concurrentes para evitar carreras entre sync manual y automatico
- Estado offline visible en login, cartera y detalle con fecha de ultima sincronizacion
- Guardado de pagos desacoplado del sync inmediato para no bloquear la cobranza por red inestable
- Vista dedicada de outbox pendiente con contexto de cliente, cuota y acceso directo al prestamo
- Estado visible de reautenticacion pendiente cuando el backend rechaza el token pero la cartera local sigue operativa
- Atajos nativos de llamada y WhatsApp desde cliente y prestamo
- Cola de cobranza con etiquetas de urgencia y acciones directas de contacto
- Dependencias Expo alineadas con SDK 56 y `expo-doctor` en verde
- Export web operativo para QA con adaptadores locales de sesion y cartera en navegador
- Login y sincronizacion desde QA web corregidos para loopback local contra el backend desktop
- Recorrido comparativo validado sobre cartera, calculadora, alta de cliente, alta de prestamo y detalle de prestamo
- Limpieza de textos en ficha de cliente para evitar caracteres corruptos en la UI

### Watch Items

- Pendiente smoke test completo sobre dispositivo fisico con login, bootstrap, offline, resync y permisos de calendario/compartir
- Pendiente smoke test manual especifico de `deletedIds` y recalculo de cuotas con `docs/SYNC_SMOKE.md`

# Mobiloan Release Notes

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

# Mobiloan Graphify Output

Esta carpeta queda reservada para la salida de Graphify del track mobile.

## Estado

- Separada del `graphify-out/` del desktop
- Lista para recibir analisis de arquitectura y dependencias del workspace `Mobiloan`

## Ultima actualizacion importante

- 2026-06-04: se creo la fundacion offline-first de Mobiloan
- 2026-06-04: se agrego reconciliacion visual de outbox rechazada y setup Android inicial
- 2026-06-04: se genero el APK debug local de prueba para Android
- 2026-06-04: se corrigio la configuracion LAN del backend y se genero el APK release para instalacion por QR
- 2026-06-09: se agrego soporte local para `deletedIds` y limpieza de cuotas reemplazadas en sincronizacion incremental
- 2026-06-09: se bloquearon localmente sobrepagos y pagos sobre cuotas ya cerradas
- 2026-06-09: se documento el smoke guide `docs/SYNC_SMOKE.md` para validar bootstrap, borrados y recalculo
- 2026-06-11: la cola de cobranza y la reconciliacion quedaron conectadas a la cuota exacta dentro del detalle del prestamo
- 2026-06-11: la app ahora intenta resincronizar automaticamente al restaurar sesion y al volver al foreground
- 2026-06-11: la app expone mejor el modo offline y desacopla el guardado local del sync inmediato en cobranza
- 2026-06-11: la cartera ahora separa visualmente outbox pendiente y outbox rechazada
- 2026-06-11: la app marca cuando la sesion remota requiere reautenticacion sin bloquear la cartera local
- 2026-06-11: se agregaron atajos de llamada y WhatsApp desde cliente y prestamo
- 2026-06-11: la cola principal ya combina urgencia, contacto y acceso directo a la cuota
- 2026-06-15: el workspace quedo alineado con Expo SDK 56 y `expo-doctor` paso sin observaciones
- 2026-06-15: se agregaron adaptadores web para sesion y base local, habilitando export web de QA sin depender de `expo-sqlite` wasm
- 2026-06-15: se agrego entrada autonoma en modo local sin backend
- 2026-06-15: se agregaron altas locales de clientes y prestamos
- 2026-06-15: se agrego calculadora local con amortizacion
- 2026-06-15: se agregaron recordatorios de cobranza en calendario nativo
- 2026-06-15: los recordatorios pasaron a crear tambien notificaciones locales nativas en Android/iOS
- 2026-06-15: se agrego exportacion portable local para posterior intake o sync con desktop
- 2026-06-15: el desktop quedo capaz de importar el paquete portable JSON de Mobiloan
- 2026-06-15: se corrigio el login con sync desde QA web local al permitir origenes loopback en el backend desktop
- 2026-06-15: se completo una pasada comparativa sobre las pestanas funcionales clave de Mobiloan
- 2026-09-30: se agrego `scripts/build-android-release.ps1` y `npm run android:release` para compilar el APK standalone con bundle JS embebido
- 2026-09-30: `scripts/install-android-beta.ps1` ahora prioriza el release y rechaza el debug sin bundle salvo `-AllowDebug`
- 2026-09-30: se confirmo que el `app-release.apk` del 2026-06-08 no contenia el modo local ni la exportacion portable, y que el `app-debug.apk` del 2026-07-01 no traia bundle
- 2026-09-30: se regenero el APK release standalone desde el workspace actual

## Nota de frescura

- El reporte Graphify raiz del repo fue refrescado el `2026-09-30`.
- El grafo de este workspace mobile se refresco por ultima vez el `2026-06-11`; conviene regenerarlo con `graphify update .` desde `Mobiloan/` despues de cerrar cambios de codigo.

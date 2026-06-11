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

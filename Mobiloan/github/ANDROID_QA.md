# Mobiloan Android QA

## Smoke test de terreno

- App abre en Expo Go
- Login funciona con backend LAN
- Sync inicial descarga cartera
- Modo avion o Wi-Fi apagado mantiene cartera visible
- Registro de pago crea outbox pendiente
- Sync posterior aplica la mutacion
- Si servidor rechaza, la mutacion aparece en reconciliacion
- Reintentar o descartar funciona
- Cliente borrado en servidor desaparece tras `sync/changes`
- Recálculo de prestamo reemplaza cuotas sin dejar residuos locales
- Sobrepago y cuota cerrada se bloquean antes de crear outbox

## Resultado actual esperado

- APK debug local ya generado
- Producto listo para primer smoke test manual en Android
- Aun no listo para publicacion amplia

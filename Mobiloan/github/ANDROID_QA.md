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

## Smoke test standalone (sin PC y sin backend)

Validar sobre el APK `release`, no sobre Expo Go:

- Instalar `app-release.apk` en el telefono (o `npm run android:install` por USB)
- Abrir `Mobiloan` con el PC apagado y sin Wi-Fi
- Entrar en `Entrar en modo local`
- Crear un cliente de prueba y confirmar que aparece en la cartera
- Crear un prestamo de prueba y revisar la tabla de amortizacion generada
- Abrir la calculadora local y comprobar el resultado de una cuota
- Crear un recordatorio de cobranza y aceptar permisos de calendario y notificaciones
- Verificar que el evento queda en el calendario del telefono y que la notificacion local queda agendada
- Probar el atajo de WhatsApp o llamada desde el cliente o el prestamo
- Exportar el paquete portable y confirmar que el archivo JSON se comparte o guarda
- Cerrar y reabrir la app para confirmar que los datos locales persisten
- Importar el paquete portable en Loan Manager desktop y confirmar que el intake lo acepta

## Resultado actual esperado

- APK release standalone generado desde el workspace actual
- Producto listo para beta controlada en Android con modo local autonomo
- Aun no listo para publicacion amplia en tienda: falta keystore propio y smoke test en dispositivo fisico registrado

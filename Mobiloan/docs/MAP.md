# Mobiloan Map

## Identidad

- Nombre del producto: `Mobiloan`
- Alcance: cobranza mobile offline-first
- Workspace: `C:\Users\JP\Desktop\LoanManager\Mobiloan`

## Canales propios

- Documentacion funcional: `docs/`
  - Smoke guide de sync: `docs/SYNC_SMOKE.md`
- Publicacion y seguimiento GitHub: `github/`
- Analisis estructural Graphify: `graphify-out/`

## Estado actual

### Fundacion lista

- Workspace Expo 56 creado
- Expo Router configurado
- SQLite local inicializada para clientes, prestamos, pagos, transacciones y outbox
- Secure Store configurado para JWT
- Servicio de sync conectado a `bootstrap`, `changes` y `push`
- `deletedIds` aplicados localmente para limpiar clientes o cuotas reemplazadas
- Pantallas base para login, cartera, cliente y prestamo
- Reconciliacion visual de mutaciones rechazadas agregada
- Navegacion directa desde cola o rechazo hacia la cuota exacta dentro del prestamo
- Primer setup Android de prueba documentado
- Proyecto nativo `android/` generado
- Perfil `preview` APK preparado con `eas.json`
- APK debug local generado correctamente
- APK release LAN generado y servido por QR local

### Principio operativo

- La app debe poder usarse localmente sin internet
- La cartera se consulta desde SQLite
- Los pagos se guardan primero en outbox local
- La sincronizacion empuja outbox y luego trae cambios del servidor
- Los borrados del servidor deben propagarse mediante `deletedIds`
- La sesion restaurada intenta resincronizar automaticamente al abrir la app y al volver al foreground
- Login, cartera y detalle de prestamo muestran estado offline y ultima sincronizacion para evitar dudas operativas en terreno
- La cartera principal ya distingue outbox pendiente versus outbox rechazada para facilitar seguimiento operativo
- El estado de reautenticacion pendiente no bloquea la cobranza offline, pero deja visible que el backend ya no acepta la sesion remota
- Cliente y prestamo ya incluyen atajos de llamada y WhatsApp para acelerar la gestion en terreno
- La cola principal de cobranza ya permite priorizar por urgencia y contactar al cliente sin salir de la pantalla

## Regla de mantenimiento

Despues de cada actualizacion importante de Mobiloan se deben actualizar estos canales:

1. `docs/MAP.md`
2. `docs/UPDATE_LOG.md`
3. `github/RELEASE_NOTES.md`
4. `graphify-out/README.md`

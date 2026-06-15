# Mobiloan Map

## Identidad

- Nombre del producto: `Mobiloan`
- Alcance: cobranza mobile offline-first con modo autonomo local
- Workspace: `C:\Users\JP\Desktop\LoanManager\Mobiloan`
- Acceso separado para trabajo/pruebas: `C:\Users\JP\Desktop\Mobiloan-Workspace`

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
- Validacion de dependencias Expo SDK 56 limpia en `expo-doctor`
- Export web funcional para QA rapido con adaptadores locales de sesion y base de datos
- Entrada en `modo local` sin backend
- Alta local de clientes
- Alta local de prestamos
- Calculadora local de prestamos
- Recordatorios de cobranza con calendario nativo y notificacion local
- Exportacion de paquete portable local para posterior sync o intake en desktop
- Validacion comparativa manual de pestanas clave contra el flujo desktop beta
- Login remoto y sincronizacion validados desde QA local contra el backend desktop

### Principio operativo

- La app debe poder usarse localmente sin internet
- La cartera se consulta desde SQLite
- Los clientes y prestamos tambien pueden nacer localmente en SQLite
- Los pagos se guardan primero en outbox local
- La sincronizacion empuja outbox y luego trae cambios del servidor
- Los borrados del servidor deben propagarse mediante `deletedIds`
- La sesion restaurada intenta resincronizar automaticamente al abrir la app y al volver al foreground
- Login, cartera y detalle de prestamo muestran estado offline y ultima sincronizacion para evitar dudas operativas en terreno
- La cartera principal ya distingue outbox pendiente versus outbox rechazada para facilitar seguimiento operativo
- El estado de reautenticacion pendiente no bloquea la cobranza offline, pero deja visible que el backend ya no acepta la sesion remota
- Cliente y prestamo ya incluyen atajos de llamada y WhatsApp para acelerar la gestion en terreno
- La cola principal de cobranza ya permite priorizar por urgencia y contactar al cliente sin salir de la pantalla
- En web de QA la persistencia local usa `localStorage` para evitar bloquear el arranque por dependencias nativas
- El modo local permite seguir operando aunque nunca se configure backend
- La app ya puede dejar recordatorios de cobranza en el calendario del telefono
- En Android e iOS el recordatorio tambien agenda una notificacion local para no depender solo del calendario
- En QA web el recordatorio nativo se bloquea con mensaje explicito porque calendario y notificaciones son solo del dispositivo
- La exportacion local prepara el puente para sincronizacion opcional posterior con desktop
- El desktop beta ya puede importar el paquete portable JSON generado desde Mobiloan

## Validacion funcional reciente

- Cartera principal validada en modo local y en sesion remota con sync
- Calculadora de prestamos validada con tabla de amortizacion local
- Alta local de clientes validada
- Alta local de prestamos validada
- Detalle de prestamo validado con contacto, registro offline y accion de recordatorio
- Flujo `Entrar y sincronizar` validado contra backend local luego del ajuste de CORS loopback

## Regla de mantenimiento

Despues de cada actualizacion importante de Mobiloan se deben actualizar estos canales:

1. `docs/MAP.md`
2. `docs/UPDATE_LOG.md`
3. `github/RELEASE_NOTES.md`
4. `graphify-out/README.md`

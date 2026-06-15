# Mobiloan

Base Expo/TypeScript para la app mobile offline-first de cobranza, separada de la version desktop de Loan Manager.

## Objetivo actual

- mantener una cartera local usable sin internet,
- permitir operacion autonoma total en Android sin backend activo,
- dar de alta clientes y prestamos localmente,
- usar calendario, WhatsApp y calculadora desde el telefono,
- exportar un paquete portable local para posterior ingesta o sincronizacion con desktop,
- reutilizar el backend actual cuando exista conectividad sin duplicar reglas monetarias.

## Stack

- Expo 56
- Expo Router
- Expo SQLite
- Expo Secure Store
- Expo Calendar
- Expo File System
- Expo Sharing
- TanStack Query
- React Hook Form

## Modos de operacion

### Modo autonomo local

- No requiere backend ni servidor corriendo en el desktop
- Permite entrar desde `Entrar en modo local`
- Guarda clientes y prestamos en almacenamiento local
- Genera recordatorios de cobro en el calendario del dispositivo
- Permite exportar un paquete portable local para mover datos despues

### Modo con backend

- Usa login remoto y sincronizacion contra `bootstrap`, `changes` y `push`
- Mantiene el mismo backend de Loan Manager cuando se necesita reconciliar con desktop

## Configuracion del backend

La app usa esta prioridad para resolver el backend:

1. `EXPO_PUBLIC_API_URL` si existe en `Mobiloan/.env`
2. la IP del host de Expo durante desarrollo
3. `10.0.2.2:3011` en emulador Android o `127.0.0.1:3011` en iOS/simulador

Ejemplo para telefono real:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.50:3011/api
```

Si vas a probar desde un telefono real o un APK instalado con sincronizacion remota, deja esa variable apuntando a la IP LAN del backend.

## Comandos

```bash
npm install
npm run start
npm run android
npm run android:prebuild
npm run android:debug
npm run doctor
npm run typecheck
```

APK debug actual:

- `android/app/build/outputs/apk/debug/app-debug.apk`

## Flujo actual

### Flujo local autonomo

1. Entrar en `modo local`
2. Inicializar base local
3. Crear clientes localmente
4. Crear prestamos locales con tabla de amortizacion
5. Agendar recordatorios en calendario
6. Contactar por WhatsApp o llamada
7. Exportar paquete portable para ingestion posterior

### Flujo con backend

1. Login contra `POST /api/auth/login`
2. Guardado seguro del token
3. Inicializacion de SQLite local
4. `sync/bootstrap` o `sync/changes`
5. Registro offline de pagos en `outbox_mutations`
6. `sync/push` para enviar mutaciones pendientes

## Estructura

- `app/`
  - router y pantallas base
- `src/data/database.ts`
  - esquema SQLite y consultas locales
- `src/lib/amortization.ts`
  - calculo local de prestamos y cuotas
- `src/lib/calendar.ts`
  - recordatorios nativos en calendario
- `src/lib/syncPackage.ts`
  - exportacion portable local para desktop
- `src/services/sync.ts`
  - bootstrap, pull, push y cola offline
- `src/providers/AppProviders.tsx`
  - sesion segura + React Query
- `docs/`
  - mapa Markdown y seguimiento funcional de Mobiloan
- `github/`
  - release notes, checklist y materiales para publicar
- `graphify-out/`
  - salida y notas separadas de Graphify para el track mobile
- `android/`
  - proyecto nativo generado para la pista Android de prueba
- `scripts/build-android-debug.ps1`
  - compila el APK debug usando el JDK/SKD local configurado

## Estado beta actual

- La app ya puede operar sola en Android para alta local y consulta operativa
- Ya existen accesos a WhatsApp y recordatorios de calendario en los flujos principales
- La calculadora de prestamos ya existe dentro de la app
- La sincronizacion con desktop queda como paso posterior y opcional
- El workspace tambien esta expuesto por separado en `C:\Users\JP\Desktop\Mobiloan-Workspace`

## Siguiente paso recomendado

- cerrar el flujo desktop de importacion o sync de paquetes exportados desde mobile
- hacer smoke test completo en dispositivo fisico con permisos de calendario y compartir archivo
- preparar APK beta final para pruebas operativas

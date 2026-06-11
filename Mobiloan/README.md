# Mobiloan

Base Expo/TypeScript para la app mobile offline-first de cobranza, separada de la version desktop de Loan Manager.

## Objetivo de esta fundacion

- mantener una cartera local usable sin internet,
- guardar pagos en una outbox persistente,
- sincronizar con `bootstrap`, `changes` y `push`,
- reutilizar el backend actual sin duplicar reglas monetarias.

## Stack

- Expo 56
- Expo Router
- Expo SQLite
- Expo Secure Store
- TanStack Query
- React Hook Form

## Configuracion

La app usa esta prioridad para resolver el backend:

1. `EXPO_PUBLIC_API_URL` si existe en `Mobiloan/.env`
2. la IP del host de Expo durante desarrollo
3. `10.0.2.2:3011` en emulador Android o `127.0.0.1:3011` en iOS/simulador

Ejemplo para telefono real:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.50:3011/api
```

Si vas a probar desde un telefono real o un APK instalado, deja esa variable apuntando a la IP LAN del backend.

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

## Siguiente paso recomendado

- agregar filtros operativos de cobranza: vencidas, hoy, proximas
- mostrar mutaciones rechazadas con UI de reconciliacion
- preparar build Android de prueba

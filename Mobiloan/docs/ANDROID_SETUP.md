# Mobiloan Android Setup

## Objetivo

Dejar un flujo simple para probar Mobiloan en Android con backend LAN y uso offline-first.

## Requisitos

- backend de Loan Manager corriendo en una IP accesible desde el telefono
- mismo Wi-Fi entre PC y telefono para la primera prueba online
- Expo Go instalado en Android

## Variable de entorno

Crear `Mobiloan/.env` con:

```env
EXPO_PUBLIC_API_URL=http://TU_IP_LAN:3011/api
```

Ejemplo:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.50:3011/api
```

## Arranque

Desde `Mobiloan/`:

```bash
npm run start
```

Luego:

1. abrir Expo Go
2. escanear el QR
3. iniciar sesion
4. ejecutar sync inicial
5. apagar Wi-Fi o datos
6. validar consulta local y guardado en outbox
7. volver a conectarse
8. ejecutar sincronizacion y revisar outbox rechazada o aplicada

## Build local

Scripts disponibles:

```bash
npm run doctor
npm run android:prebuild
npm run android:debug
```

### Estado actual de esta maquina

La compilacion local debug ya quedo resuelta con este carril:

- JDK: `C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot`
- SDK root: `C:\Users\JP\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe`
- Script utilitario: `scripts/build-android-debug.ps1`
- APK generado: `android/app/build/outputs/apk/debug/app-debug.apk`

Nota operativa:

- la build debug local incluye `arm64-v8a` y `x86_64` en `android/gradle.properties` para servir tanto a telefono fisico como emulador Android
- el SDK acepto licencias y descargo componentes faltantes durante la primera compilacion

## Build remota sugerida

Tambien quedo preparado `eas.json` con perfil `preview` para APK:

```bash
npx eas build --platform android --profile preview
```

## Casos minimos a validar

- login exitoso
- bootstrap completo
- lista local de clientes visible sin internet
- detalle de prestamo visible sin internet
- registro de pago en outbox sin internet
- push exitoso al volver la conectividad
- rechazo visible y reconciliable si hay sobrepago

# Mobiloan Android Setup

## Objetivo

Dejar un flujo simple para probar Mobiloan en Android con backend LAN y uso offline-first.
Tambien permitir una prueba beta inmediata en modo autonomo local, sin depender del backend desktop.

## Requisitos

- backend de Loan Manager corriendo en una IP accesible desde el telefono
- mismo Wi-Fi entre PC y telefono para la primera prueba online
- Expo Go instalado en Android

Para modo autonomo local:

- no hace falta backend
- solo hace falta instalar el APK en el telefono

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

## Prueba autonoma local

Desde `Mobiloan/`:

```bash
npm run android:release
npm run android:install
```

Luego en el telefono:

1. abrir `Mobiloan`
2. entrar en `modo local`
3. crear un cliente de prueba
4. crear un prestamo de prueba
5. abrir el calendario o recordatorio si aplica
6. exportar el paquete portable local

Notas:

- `npm run android:release` es el carril correcto para usar la app sola en el telefono: compila `assembleRelease` con `NODE_ENV=production` y verifica que el APK lleve el bundle JS embebido
- `npm run android:install` instala por defecto `android/app/build/outputs/apk/release/app-release.apk`
- el APK debug se rechaza salvo que pidas `-AllowDebug`, porque no trae bundle y solo funciona con Metro corriendo en el PC
- si `adb` no detecta el telefono, conecta el cable USB, desbloquea Android y acepta la depuracion USB

### Por que release y no debug

| Variante | Bundle JS embebido | Sirve sin PC | Uso previsto |
|---|---|---|---|
| `release/app-release.apk` | Si | Si | Beta de terreno y uso autonomo local |
| `debug/app-debug.apk` | No | No | Solo desarrollo con Metro encendido |

Para confirmar el contenido de un APK:

```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('<ruta-al-apk>')
$zip.Entries | Where-Object FullName -eq 'assets/index.android.bundle'
$zip.Dispose()
```

Si no aparece `assets/index.android.bundle`, ese APK necesita Metro y no sirve para la beta en el celular.

## Build local

Scripts disponibles:

```bash
npm run doctor
npm run android:prebuild
npm run android:debug
npm run android:release
npm run android:install
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

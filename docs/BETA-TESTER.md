# Instrucciones Para Testers Beta

## Archivo de instalacion

Usa este instalador:

- `C:\Users\JP\Desktop\LoanManager\release\LoanManager-Setup-1.0.0.exe`

Tambien existe una version portable para pruebas internas:

- `C:\Users\JP\Desktop\LoanManager\release\win-unpacked\Loan Manager.exe`

## Instalacion

1. Ejecuta `LoanManager-Setup-1.0.0.exe`.
2. Completa la instalacion normalmente.
3. Abre `Loan Manager` desde el acceso directo o desde el menu Inicio.

## Primera ejecucion

En una instalacion limpia, la app permite crear el primer usuario desde la pantalla de acceso.

Pasos:

1. En la pantalla de login, haz clic en `No tienes cuenta? Registrate`.
2. Ingresa un `usuario`.
3. Ingresa una `contrasena`.
4. Presiona `Crear Cuenta`.
5. Luego vuelve a iniciar sesion con esas credenciales.

## Importante

El registro esta disponible solo durante la configuracion inicial.

Eso significa:

- si la app no tiene usuarios creados todavia, veras el flujo de registro
- si ya existe un usuario en ese equipo, no se podra crear otro desde esa pantalla

## Si la opcion de registro no funciona

Lo mas probable es que esa maquina ya tenga datos previos de Loan Manager.

Opciones:

1. Inicia sesion con el usuario que ya fue creado en ese equipo.
2. Si necesitas probar como instalacion completamente nueva, cierra la app y elimina la carpeta de datos local:
   - `C:\Users\<TU_USUARIO>\AppData\Roaming\loan-manager`
3. Abre la app otra vez y repite el flujo de registro inicial.

## Que validar en la beta

- inicio de sesion
- creacion del primer usuario
- clientes
- prestamos
- pagos parciales
- pagaré y mutuo
- exportacion
- respaldo

## Si algo falla

Revisa este log:

- `C:\Users\<TU_USUARIO>\AppData\Roaming\loan-manager\debug-log.txt`

Si reportas un problema, idealmente incluye:

- que estabas haciendo
- si fue instalador o version portable
- mensaje visible en pantalla
- contenido relevante de `debug-log.txt`

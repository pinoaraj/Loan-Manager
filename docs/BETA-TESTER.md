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

Hay dos causas posibles.

Causa 1: esa maquina ya tiene datos previos de Loan Manager.

Opciones:

1. Inicia sesion con el usuario que ya fue creado en ese equipo.
2. Si necesitas probar como instalacion completamente nueva, cierra la app y elimina la carpeta de datos local:
   - `C:\Users\<TU_USUARIO>\AppData\Roaming\loan-manager`
3. Abre la app otra vez y repite el flujo de registro inicial.

Atencion: eliminar esa carpeta borra clientes, prestamos y pagos guardados en ese equipo. Haz un respaldo antes si ya tienes datos reales.

Causa 2: estas usando un instalador anterior al arreglo del `2026-09-30`.

Los instaladores antiguos incluian por error una base de datos de prueba con usuarios ya creados. Eso impedia registrar el primer usuario en un equipo nuevo.

Solucion:

1. Desinstala Loan Manager.
2. Elimina la carpeta `C:\Users\<TU_USUARIO>\AppData\Roaming\loan-manager`.
3. Instala de nuevo usando el instalador actualizado.

Los instaladores actuales ya no incluyen ninguna base de datos, asi que una instalacion limpia siempre permite crear el primer usuario.

## Que validar en la beta

- inicio de sesion
- creacion del primer usuario
- clientes
- prestamos
- pagos parciales
- pagare y mutuo
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

# Instrucciones Para Testers Beta

## Archivo de instalacion

Copia esta carpeta completa al PC donde vas a probar la beta:

- `C:\Users\JP\Desktop\INSTALADOR Loan Manager Beta`
  - `LoanManager-Setup-1.0.0.exe` -> instalador para Windows 64 bits (esta en la raiz de la carpeta)
  - `Portable\win-unpacked\Loan Manager.exe` -> version portable, no instala nada
  - `LEEME-INSTALACION.txt` -> los mismos pasos de este documento

Verificacion del instalador:

- SHA256: `B0D7F77B407522FCEB9C70C3E8292A70BF885815CD1E290C83DF4D347E2BBC44`

Estos son los mismos archivos que genera el repo en `release/`, pero ya juntos y probados para probar la beta en otro equipo.

## Instalacion

1. Ejecuta `LoanManager-Setup-1.0.0.exe`.
2. Completa la instalacion normalmente.
3. Abre `Loan Manager` desde el acceso directo o desde el menu Inicio.

Nota sobre permisos:

- En un PC que nunca tuvo Loan Manager, la instalacion es por usuario y no pide permisos de administrador.
- Si ese PC ya tiene una version instalada, Windows pedira permisos de administrador para reemplazarla. Acepta el aviso.

## Probar sin instalar (version portable)

1. Abre `Portable\win-unpacked\Loan Manager.exe`.
2. La primera apertura tarda unos 10 segundos porque crea la base de datos local.

Sirve para probar en un PC donde no quieras o no puedas instalar nada.

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

Causa 3: el instalador es actual, pero el PC tiene la app en una ruta con espacios y fallaba al migrar.

Eso quedo corregido en la version del `2026-09-30`: el arranque ya no depende de `cmd.exe` y ahora funciona incluso instalada en `C:\Program Files\Loan Manager`. Usa siempre el instalador de la carpeta `LoanManager-Beta-1.0.0`.

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

Revisa estos archivos:

- `C:\Users\<TU_USUARIO>\AppData\Roaming\loan-manager\debug-log.txt` (arranque del escritorio)
- `C:\Users\<TU_USUARIO>\AppData\Roaming\loan-manager\logs\` (logs del backend)

Si reportas un problema, idealmente incluye:

- que estabas haciendo
- si fue instalador o version portable
- mensaje visible en pantalla
- contenido relevante de `debug-log.txt`

# Instalar Mobiloan beta en tu celular (sin PC, sin servidor)

Esta guia deja la app funcionando sola en el telefono: no necesita el PC encendido, ni cable, ni backend.

## Que necesitas

- Un celular Android (Android 7 o superior).
- El archivo `mobiloan-beta-1.2.10.apk` transferido al telefono (por cable USB, WhatsApp, Drive o Telegram).

## Atajo: instalar escaneando un QR (misma red Wi-Fi)

Si el PC y el celular estan en la misma red Wi-Fi, no hace falta pasar el archivo a mano:

1. En el PC, deja sirviendo la carpeta del APK:

   ```powershell
   python -m http.server 8099 --bind 0.0.0.0 --directory C:\Users\JP\Desktop\LoanManager\Mobiloan\dist
   ```

2. Abre en pantalla `Mobiloan\dist\install-qr-beta-1.2.10.png` y escanealo con la camara del celular.
3. El telefono abre el navegador y descarga `mobiloan-beta-1.2.10.apk`.
4. Sigue los pasos 2 y 3 de esta guia.

Si la descarga no abre, revisa que Windows Firewall permita Python en redes privadas, o usa la transferencia por cable.

## Paso 1: pasar el APK al telefono

Cualquiera de estas opciones sirve:

- Enviar el APK por WhatsApp a tu propio chat y descargarlo en el celular.
- Copiarlo por cable USB a la carpeta `Download` del telefono.
- Subirlo a Drive y descargarlo desde el telefono.

## Paso 2: permitir la instalacion

Android bloquea apps que no vienen de Play Store. Al abrir el APK te va a pedir permiso:

1. Toca `Instalar`.
2. Si aparece "Por seguridad, tu telefono no permite instalar apps desconocidas", toca `Configuracion`.
3. Activa `Permitir desde esta fuente` para WhatsApp, Archivos o el navegador con el que abriste el APK.
4. Vuelve y toca `Instalar`.

Puede aparecer un aviso de Play Protect ("app desconocida"). Es esperable en una beta: toca `Instalar de todas formas`.

## Paso 3: primer uso

1. Abre `Mobiloan` desde el cajon de apps.
2. En la pantalla de ingreso toca `Entrar sin PC ni internet`.
3. Ya puedes operar: no hace falta usuario, clave, backend ni internet.

La pantalla de ingreso deja ese boton como accion principal. La seccion `Sincronizar con el PC (opcional)` solo aparece para quien quiera compartir la cartera con el desktop.

## Como se organiza la app

La app tiene cinco pestanas. En el telefono aparecen como barra inferior; en una tablet o con la pantalla en horizontal se convierten en una barra lateral fija, para no perder espacio vertical:

- `Inicio`: resumen compacto del dia con 4 indicadores, alerta de vencidos, hasta 3 cobros prioritarios, acciones rapidas y atajos a Cartera y Analisis.
- `Cobranza`: bandeja de cuotas vencidas, de hoy y proximas, con busqueda, llamada, WhatsApp y recordatorio.
- `Cartera`: prestamos y clientes en una sola pantalla, con buscador, filtros y boton para crear.
- `Analisis`: dividido en `Resumen`, `Proyeccion` y `Actividad` para que ninguna vista sea una lista interminable.
- `Ajustes`: dividido en `App`, `Datos` y `Sync`; en modo local, `Sync` solo explica que la app no depende del PC.

## Que puedes hacer en modo local

- Crear clientes con RUT, telefono, direccion y email.
- Crear prestamos con tabla de amortizacion local.
- Usar la calculadora de prestamos.
- Crear recordatorios de cobranza en el calendario del telefono, con notificacion local.
- Contactar por WhatsApp o llamada desde la ficha del cliente o del prestamo.
- Enviar por WhatsApp el recordatorio de pago o el comprobante de pago, con el mismo texto que usa el desktop.
- Exportar un paquete JSON portable para importarlo despues en Loan Manager desktop.
- Exportar la cartera completa a CSV (`Ajustes > Reportes`) para abrirla en Excel.

La cartera queda guardada en el telefono. Si cierras la app o reinicias el celular, los datos siguen ahi.

## Permisos que va a pedir

- Calendario: solo cuando creas un recordatorio de cobranza.
- Notificaciones: para el aviso local del recordatorio (Android 13 o superior).
- Telefono/WhatsApp: se abren como apps externas, no se pide permiso especial.

Si niegas el permiso de calendario, el recordatorio no se crea; puedes volver a intentarlo y aceptar el permiso.

## Pasar los datos al PC (opcional)

1. En Mobiloan, usa `Exportar paquete portable`.
2. Envia el archivo `mobiloan-sync-AAAA-MM-DD.json` a tu PC.
3. En Loan Manager desktop, abre `Importar datos` y selecciona ese JSON.

Asi la cartera creada en el telefono entra al desktop sin servidores intermedios.

## Sincronizar con el PC (opcional, requiere misma red)

Este modo no es necesario para la beta local. Solo sirve si quieres compartir la misma cartera entre el PC y el telefono:

1. Enciende el PC con Loan Manager abierto (backend en el puerto 3011).
2. Verifica la IP del PC con `ipconfig` (por ejemplo `192.168.1.50`).
3. En el telefono, usa `Entrar y sincronizar` con la misma red Wi-Fi.
4. Si el APK se compilo con una IP distinta en `Mobiloan/.env`, esa sincronizacion va a fallar: hay que recompilar con la IP actual.

El modo local no depende de esto.

## Notas de esta beta

- Version de la app: `1.2.10` (`versionCode 13`, `com.mobiloan.app`).
- La ficha del prestamo muestra la tabla de cuotas completa: numero, vencimiento, estado (`Pagada`, `Parcial`, `Vencida`, `Pendiente`), monto, saldo corrido y el reparto `Cap · Int` de cada cuota. El calculo se hace en el telefono con el mismo calendario del desktop.
- Los pagos parciales quedan visibles: la cuota pasa a `Parcial`, muestra una barra de avance, `Pagado $X · Restan $Y` y la transaccion registrada con su boton `Enviar comprobante`.
- Si eliges una cuota ya pagada, la app avisa `Cuota ... ya esta pagada por completo` en vez de mostrar un saldo de `$0`.
- En tablet o con el telefono en horizontal, las pantallas usan dos columnas como el desktop: el detalle del prestamo separa `Contacto / Documentos / Administrar` de `Registrar pago / Cuotas`, el prestamo nuevo muestra el formulario junto a la vista previa, y la ficha del cliente separa `Ficha` de `Prestamos / Zona de riesgo`.
- La tabla de la calculadora suma la columna `Saldo` con el saldo corrido. En el telefono cada cuota se ve como fila apilada (`1 · 13-12-2026`, monto, `Cap · Int · Saldo`) en lugar de una tabla con desplazamiento lateral.
- La rotacion ya no esta bloqueada: al girar el telefono la app reacomoda la barra inferior como barra lateral y aprovecha el ancho.
- Los cuatro indicadores de `Inicio` ya no se apilan: en el telefono se ven como una grilla 2x2 y en pantalla ancha como una sola fila de cuatro tarjetas. En horizontal comparten el ancho en partes iguales.
- Los textos que no calzaban se corrigieron: frecuencia, tipo de prestamo, estado de cuota, metodo de pago y estado del prestamo se muestran en espanol (`Cuota fija`, `Mensual`, `Pagada`, `Efectivo`, `Moroso`). Los valores internos no cambian, solo la presentacion.
- Un pago completo deja la cuota en `$0` exacto: se agrego tolerancia de 1 peso y un tope al saldo pendiente, asi no queda un sobrante de `$1` por redondeo. Al elegir una cuota, el monto se completa solo con el saldo y se recalcula despues de guardar.
- Los textos ya no se cortan ni se salen de su espacio: nombres largos, montos y botones se ajustan al ancho disponible (incluida la accion rapida de la calculadora).
- La calculadora quedo igual al simulador del desktop: parametros, tarjeta oscura con la cuota estimada, informacion del plan y tabla de amortizacion.
- La navegacion es adaptativa: barra inferior en telefono y barra lateral permanente cuando el ancho supera 720 dp. Ya no hay que recorrer una pantalla infinita.
- El modo independiente es la opcion principal. Dentro de ese modo la app no muestra sincronizacion, outbox ni contadores del backend, para que quede claro que no depende del PC.
- `Inicio` es un tablero compacto: 4 indicadores (`Total prestado`, `Cobranza del mes`, `Vencido`, `Clientes`), alerta de vencidos, hasta 3 cobros prioritarios con WhatsApp y calendario, acciones rapidas y atajos. Las listas completas viven en sus propias pestanas.
- Las alertas de pago y la pantalla de cobranza prellenan el mensaje de WhatsApp con el texto del desktop (aviso de vencido o recordatorio de proxima cuota, con el numero de cuota cuando aplica).
- La ficha de prestamo permite enviar el comprobante de pago por WhatsApp de cualquier transaccion registrada.
- `Ajustes > Reportes` permite exportar la cartera completa a CSV compatible con Excel.
- Se agrego una barra superior unica por pantalla (sin el rotulo interno `(app)`), cobranza con filtros vencidas/hoy/proximas, lista de prestamos con salud de cartera y ficha de prestamo con contrato PDF, pagare PDF, CSV, pausar/reanudar, recalcular y eliminar.
- La ficha de cliente permite editar y eliminar clientes creados en el telefono.
- La cartera creada en modo local ya no se borra al entrar con una cuenta o al sincronizar con el PC: la app distingue los registros del telefono de los que bajan del backend. Al cerrar sesion se limpia solo la copia remota, la cola de envio y los cursores.
- Las cuotas de fin de mes ya no se corren al mes siguiente: un prestamo que empieza el 31 de enero vence el 28 de febrero, el 31 de marzo y el 30 de abril.
- El APK esta firmado con la clave de desarrollo, por eso Android muestra el aviso de origen desconocido y Play Protect. Sirve para probar en tu telefono y para repartir a testers, no para publicar en Play Store.
- Si mas adelante se firma con una clave propia, hay que desinstalar esta version antes de instalar la firmada.
- No hay actualizaciones automaticas: cada version nueva se instala encima con `Instalar` nuevamente (los datos locales se conservan).
- La sincronizacion remota con el PC usa `http://` en red local, por eso el APK trae trafico sin cifrar habilitado para la LAN.

## Si algo falla

- "App no instalada": desinstala una version previa de Mobiloan y vuelve a intentar.
- La app abre pero no ve clientes: verifica que entraste con `Entrar en modo local`.
- El recordatorio no aparece: revisa permisos de calendario y notificaciones del app en Ajustes de Android.
- Si necesitas reinstalar por USB: conecta el telefono, acepta `Depuracion USB` y ejecuta `npm run android:install` en el PC.


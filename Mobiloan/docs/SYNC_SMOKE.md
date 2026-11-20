# Mobiloan Sync Smoke

## Objetivo

Validar en un entorno de prueba que `Mobiloan` refleja correctamente:

- bootstrap inicial,
- cambios incrementales,
- borrados propagados por `deletedIds`,
- reemplazo de cuotas despues de un recálculo,
- y rechazos previsibles de cobranza.

## Precondiciones

- Backend de `Loan Manager` corriendo con `/api/sync/*` disponible.
- `Mobiloan` apuntando al backend correcto mediante `EXPO_PUBLIC_API_URL`.
- Usuario de prueba disponible o capacidad para registrar uno nuevo.
- Dataset de prueba, nunca cartera productiva.

## Caso 1: Bootstrap inicial

1. Iniciar sesion en `Mobiloan`.
2. Ejecutar sincronizacion manual.
3. Confirmar que aparecen clientes, prestamos y cuotas en cartera.
4. Confirmar que el panel de sincronizacion muestra un `cursor` nuevo.

Resultado esperado:

- La cartera local deja de estar vacia.
- `Clientes locales` y `Prestamos locales` muestran valores mayores que cero.

## Caso 2: Borrado de cliente sin prestamos

1. En desktop o por API, crear un cliente de prueba sin prestamos.
2. Ejecutar sincronizacion en `Mobiloan` y confirmar que el cliente aparece localmente.
3. Borrar ese cliente en servidor.
4. Ejecutar `Sincronizar` en `Mobiloan`.
5. Buscar el cliente borrado en la cartera local.

Resultado esperado:

- El cliente ya no aparece en SQLite local.
- No quedan prestamos ni pagos huérfanos asociados a ese cliente.

## Caso 3: Recálculo que reemplaza cuotas

1. Crear un prestamo de prueba sin transacciones registradas.
2. Ejecutar sync y abrir el detalle del prestamo en `Mobiloan`.
3. Anotar cantidad de cuotas y fechas visibles.
4. En servidor, ejecutar recálculo del prestamo.
5. Ejecutar sync otra vez en `Mobiloan`.
6. Volver a abrir el detalle del prestamo.

Resultado esperado:

- Desaparecen las cuotas antiguas reemplazadas.
- Solo quedan visibles las cuotas nuevas.
- No se mezclan cuotas viejas y nuevas en el mismo prestamo.

## Caso 4: Cuota cerrada

1. Pagar completamente una cuota en servidor.
2. Ejecutar sync en `Mobiloan`.
3. Intentar registrar otro pago offline sobre esa misma cuota.

Resultado esperado:

- La app bloquea el intento antes de enviarlo a la outbox.
- El usuario ve el mensaje de cuota cerrada o sin saldo pendiente.

## Caso 5: Sobrepago prevenido localmente

1. Seleccionar una cuota con saldo pendiente menor al monto que se quiere ingresar.
2. Intentar guardar un pago mayor al saldo restante.

Resultado esperado:

- La app no guarda la mutacion en outbox.
- El usuario ve el saldo pendiente correcto en pantalla.

## Caso 6: Rechazo del servidor y reconciliacion

1. Generar una condicion de rechazo en servidor para una mutacion offline.
2. Ejecutar sync desde `Mobiloan`.
3. Revisar el panel `Reconciliacion de outbox`.

Resultado esperado:

- La mutacion aparece como rechazada.
- `Reintentar` y `Descartar` siguen funcionando.

## Señales de exito

- `sync/bootstrap` llena la base local.
- `sync/changes` agrega cambios nuevos sin duplicar datos.
- `deletedIds` elimina clientes o cuotas obsoletas.
- No quedan residuos locales despues de borrados o recálculos.
- La cobranza offline evita errores obvios antes de llegar al servidor.

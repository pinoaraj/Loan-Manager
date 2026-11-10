# PLAN-mobile-sync-contract

## Objetivo

Definir un contrato de sincronizacion entre backend y app mobile que soporte uso offline-first para cobranza sin duplicar pagos ni degradar el modelo de datos del desktop.

## Principios

- El backend sigue siendo la fuente de verdad.
- Mobile puede operar offline durante una jornada de cobranza.
- Los cambios monetarios deben ser idempotentes.
- La sincronizacion debe ser incremental.
- Los conflictos deben ser detectables y resolubles, no silenciosos.

## Entidades minimas a sincronizar

- `clients`
- `loans`
- `payments`
- `paymentTransactions`

## Campos minimos por entidad

### Client

- `id`
- `name`
- `rut`
- `phone`
- `email`
- `address`
- `createdAt`
- `updatedAt`

### Loan

- `id`
- `clientId`
- `amount`
- `interestRate`
- `durationMonths`
- `startDate`
- `frequency`
- `loanType`
- `status`
- `isPaused`
- `createdAt`
- `updatedAt`

### Payment

- `id`
- `loanId`
- `amount`
- `lateFee`
- `paidAmount`
- `dueDate`
- `status`
- `createdAt`
- `updatedAt`

### PaymentTransaction

- `id`
- `paymentId`
- `amount`
- `paymentDate`
- `method`
- `notes`
- `createdAt`
- `updatedAt`
- `clientMutationId`

## Endpoints propuestos

### `POST /api/auth/login`

Uso:

- login de mobile
- entrega JWT valido para sync y operaciones de cobranza

### `GET /api/sync/bootstrap`

Uso:

- primera descarga completa de datos necesarios para operar

Respuesta sugerida:

```json
{
  "serverCursor": "2026-06-03T14:00:00.000Z",
  "clients": [],
  "loans": [],
  "payments": [],
  "paymentTransactions": []
}
```

### `GET /api/sync/changes?cursor=...`

Uso:

- descargar solo cambios desde el ultimo cursor confirmado

Respuesta sugerida:

```json
{
  "serverCursor": "2026-06-03T15:00:00.000Z",
  "changes": {
    "clients": [],
    "loans": [],
    "payments": [],
    "paymentTransactions": []
  },
  "deletedIds": {
    "clients": [],
    "loans": [],
    "payments": [],
    "paymentTransactions": []
  }
}
```

### `POST /api/sync/push`

Uso:

- subir acciones locales pendientes en lote

Request sugerido:

```json
{
  "mutations": [
    {
      "clientMutationId": "m_01JXYZ",
      "entity": "paymentTransaction",
      "operation": "create",
      "payload": {
        "paymentId": "pay_123",
        "amount": 5000,
        "paymentDate": "2026-06-03",
        "method": "cash",
        "notes": "Cobrado en terreno"
      }
    }
  ]
}
```

Respuesta sugerida:

```json
{
  "serverCursor": "2026-06-03T15:05:00.000Z",
  "results": [
    {
      "clientMutationId": "m_01JXYZ",
      "status": "applied",
      "serverId": "txn_789"
    }
  ]
}
```

## Reglas de idempotencia

- Cada mutacion enviada por mobile debe incluir `clientMutationId`.
- El backend debe registrar mutaciones ya aplicadas por ese identificador.
- Si mobile reintenta la misma mutacion, el backend debe responder el mismo resultado sin duplicar dinero.

## Reglas de conflicto

### Clientes

- Si hay edicion concurrente, aplicar `last write wins` basado en `updatedAt` solo en campos no monetarios.

### Prestamos

- En MVP, mobile no deberia editar prestamos.
- Si en fases futuras se habilita edicion, se necesitara versionado explicito.

### Pagos y transacciones

- Las transacciones son append-only.
- Si una cuota ya quedo cerrada en servidor y mobile intenta agregar pago extra, el backend debe rechazar con error de conflicto.

## Errores esperados

Codigos sugeridos:

- `SYNC_CONFLICT`
- `INVALID_MUTATION`
- `PAYMENT_ALREADY_CLOSED`
- `OVERPAYMENT_BLOCKED`
- `AUTH_REQUIRED`
- `CURSOR_EXPIRED`

## Orden recomendado de sincronizacion

1. Confirmar token valido.
2. Hacer `push` de outbox pendiente.
3. Aplicar resultados locales.
4. Pedir `changes` desde cursor actual.
5. Actualizar base local.
6. Guardar nuevo cursor.

## Decisiones pendientes

- Si mobile podra crear clientes en MVP
- Si habra borrado logico sincronizable
- Si se agregara refresh token para sesiones largas
- Si `paymentDate` debe aceptar solo fecha local o timestamp completo

## Criterios de listo para construir

- Endpoints definidos
- Payloads aprobados
- Reglas de conflicto cerradas
- Idempotencia confirmada para pagos
- Pruebas de integracion backend preparadas

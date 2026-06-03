# PLAN-mobile-app

## Estado de prioridad

- Prioridad actual: siguiente linea de trabajo despues de cerrar la beta desktop de Windows.
- Fecha de replanificacion: `2026-06-03`.
- Decision: mobile debe nacer como producto operativo de cobranza, no como espejo completo del desktop en la primera iteracion.

## Objetivo del producto

Construir una app mobile para trabajo en terreno que permita:

- consultar cartera y proximos vencimientos,
- buscar clientes sin depender de conectividad constante,
- registrar pagos parciales o finales desde el telefono,
- sincronizar cambios de forma segura con el backend principal,
- mantener compatibilidad de datos con desktop sin degradar campos obligatorios.

## Alcance recomendado del MVP mobile

El MVP no debe intentar cubrir documentos legales, import/export ni analitica pesada. Debe resolver bien el trabajo de cobranza.

Incluido en MVP:

- login
- descarga inicial de cartera
- lista offline de clientes y prestamos
- detalle de prestamo con calendario y estado de cuotas
- registro offline de transacciones de pago
- sincronizacion pull/push
- cola persistente de cambios pendientes

Fuera del MVP:

- generacion de pagare, mutuo, PDF o Word
- importacion/exportacion XLSX
- dashboard ejecutivo completo
- alta completa de nuevos prestamos
- edicion avanzada de configuracion del negocio

## Principios de arquitectura

1. Mobile no reemplaza desktop.
   - Desktop sigue siendo la fuente principal para administracion, documentos, importaciones y configuracion.
2. Offline-first real.
   - No basta cache HTTP; la app necesita base local, outbox persistente y reconciliacion.
3. Dinero como flujo append-only.
   - Las transacciones de pago nunca deben resolverse con sobrescrituras silenciosas.
4. Prisma + validacion backend como contrato fuente.
   - La app mobile se adapta al modelo del backend; no crea un modelo paralelo.
5. Sincronizacion incremental.
   - El servidor debe exponer cambios desde un cursor o timestamp, no snapshots completos cada vez.

## Stack recomendado

- Framework: React Native con Expo
- Lenguaje: TypeScript
- Navegacion: Expo Router
- Estado remoto: TanStack Query
- Base local: SQLite local administrada por Expo
- ORM o acceso local: Drizzle SQLite o consultas SQL directas bien tipadas
- Formularios: React Hook Form + Zod
- Autenticacion: JWT existente con almacenamiento seguro en `expo-secure-store`

## Por que esta combinacion

- Expo reduce el costo de arranque y distribucion del primer MVP.
- TypeScript permite compartir tipos de dominio entre backend y mobile mas adelante.
- SQLite local da mejor control que un simple cache cuando hay cuotas, pagos y reconciliacion.
- TanStack Query sigue alineado con el enfoque ya usado en frontend web.

## Capacidades que debe heredar desde desktop

La app mobile no puede degradar el modelo ya establecido. Debe respetar:

- cliente con `RUT`
- nombre completo
- direccion
- telefono
- email si existe
- prestamos con frecuencia y tipo
- cuotas con `amount`, `lateFee`, `paidAmount`, `status`, `dueDate`
- transacciones parciales por cuota

Si mobile crea o edita clientes, el contrato debe preservar esos campos y validaciones.

## MVP funcional detallado

### 1. Autenticacion

- Login con el endpoint actual de auth
- Persistencia segura del token
- Renovacion controlada por re-login si no existe refresh token
- Estado de sesion visible cuando la app esta offline

### 2. Descarga inicial

- Sincronizar clientes, prestamos, pagos y metadatos necesarios
- Guardar `lastSyncedAt` o cursor de sincronizacion
- Marcar cuando la cartera local esta lista para uso offline

### 3. Lista operativa

- Busqueda local por nombre, `RUT` o telefono
- Filtros por vencidas, hoy, proximas y pagadas
- Indicadores de deuda pendiente y ultimo contacto

### 4. Detalle de prestamo

- Resumen del cliente
- Monto original, pagado, pendiente y estado del prestamo
- Cronograma de pagos
- Historial de transacciones por cuota

### 5. Registro de pago

- Crear transaccion offline
- Asociarla a una cuota exacta
- Validar monto positivo y no exceder reglas del backend
- Señalar claramente si la transaccion esta pendiente de sincronizar

### 6. Sincronizacion

- Pull incremental de cambios remotos
- Push secuencial de outbox local
- Reintentos seguros
- Trazabilidad minima de errores de sync

## Contrato backend que falta para soportar mobile bien

La API actual sirve para desktop y web local, pero mobile necesita endpoints o ajustes adicionales:

- `POST /api/auth/login`
  - reutilizable para mobile
- `GET /api/sync/bootstrap`
  - descarga inicial de clientes, prestamos, pagos y catalogos minimos
- `GET /api/sync/changes?cursor=...`
  - cambios incrementales desde ultimo sync
- `POST /api/sync/push`
  - lote de cambios locales pendientes
- `POST /api/payments/:id/transactions`
  - puede seguir usandose, pero conviene envolverlo en sync por lotes para offline-first

### Payload minimo sugerido para sync

- `clients`
- `loans`
- `payments`
- `paymentTransactions`
- `deletedIds` por entidad si se habilitan borrados logicos
- `serverCursor`

## Modelo de sincronizacion recomendado

### Pull

- El servidor devuelve entidades modificadas desde un cursor
- Cada entidad incluye `id`, `updatedAt` y version suficiente para reconciliar

### Push

- La app guarda acciones locales en una outbox
- Cada accion lleva `clientMutationId`
- El servidor responde con exito, error validable o conflicto

### Conflictos

- Clientes:
  - `last write wins` solo para campos no monetarios y con `updatedAt`
- Prestamos:
  - evitar edicion mobile en MVP para reducir conflictos
- Pagos y transacciones:
  - append-only
  - si el servidor rechaza una transaccion por sobrepago o estado ya cerrado, debe devolverse error reconciliable y la app debe pedir revision

## Cambios de backend recomendados antes de empezar mobile

1. Definir tipos de dominio compartibles desde el backend.
2. Agregar `updatedAt` consistente en todas las entidades relevantes si falta en algun flujo.
3. Diseñar endpoints de sync dedicados.
4. Registrar transacciones con identificador idempotente para evitar duplicados en reintentos.
5. Crear pruebas de integracion del contrato de sincronizacion.

## Cambios de producto recomendados antes de empezar mobile

1. Congelar el alcance de desktop beta.
2. Decidir si mobile podra crear clientes en MVP o solo consultar y cobrar.
3. Definir el rol exacto del usuario mobile:
   - cobrador,
   - supervisor,
   - ambos en fases distintas.
4. Definir si la app usara Play Store, APK directa o distribucion cerrada de prueba.

## Roadmap propuesto

### Fase 0. Cierre desktop y contrato

- Confirmar beta Windows publicada o lista para publicar
- Congelar cambios estructurales de modelo salvo bugs criticos
- Diseñar el contrato de sincronizacion

### Fase 1. Fundacion mobile

- Crear workspace Expo
- Configurar TypeScript, lint y estructura de carpetas
- Preparar autenticacion y storage seguro
- Crear base local SQLite

### Fase 2. Dominio offline

- Definir tablas locales de clientes, prestamos, pagos y outbox
- Implementar bootstrap inicial
- Implementar busqueda offline

### Fase 3. Cobranza MVP

- Pantalla de cartera
- Pantalla de cliente
- Pantalla de prestamo
- Registro de pago offline

### Fase 4. Sync robusto

- Push por lotes con idempotencia
- Pull incremental
- Resolucion visible de conflictos
- Telemetria basica de sync

### Fase 5. Piloto mobile

- QA con cartera de prueba
- Validacion de uso en terreno
- Ajustes de UX para conectividad pobre

## Riesgos principales

| Riesgo | Impacto | Mitigacion |
|---|---|---|
| Duplicacion de pagos por reintentos | Alto | `clientMutationId` e idempotencia en backend |
| Modelo divergente entre desktop y mobile | Alto | Prisma y Zod como contrato fuente |
| Complejidad excesiva del MVP | Alto | limitar MVP a cobranza y consulta |
| Conflictos de edicion en prestamos | Medio | evitar edicion de prestamos desde mobile al inicio |
| Mala experiencia sin internet | Alto | SQLite local + outbox + estados visibles |

## Recomendacion final

La siguiente version no deberia ser "la app completa en telefono". Deberia ser una **mobile de cobranza offline-first** que reutilice el backend actual, agregando un contrato de sincronizacion serio.

## Primeras tareas concretas sugeridas

1. Escribir `docs/PLAN-mobile-sync-contract.md`.
2. Definir si el MVP permite crear clientes o solo cobrar.
3. Diseñar endpoints `bootstrap`, `changes` y `push`.
4. Crear el workspace Expo cuando el alcance del contrato quede aprobado.

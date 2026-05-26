# PLAN-android-app

## Estado de prioridad

- Prioridad actual: baja.
- Razon: el foco principal sigue siendo terminar y estabilizar la beta desktop con Electron.
- Uso de este documento: punto de relanzamiento cuando se abra la linea mobile.

## Objetivo

Crear una app Android para cobranza y consulta operativa en terreno, con capacidad offline-first y sincronizacion posterior con el backend principal.

## Requisitos funcionales minimos heredados desde desktop

La app Android no puede nacer como una version simplificada que ignore datos ya obligatorios en desktop. Debe respetar:

- cliente con `RUT`
- nombre completo
- direccion
- telefono
- prestamos y calendario de pagos
- transacciones de pago parciales

Si se crea o edita un cliente desde mobile, el contrato de sincronizacion debe preservar esos campos y no degradar el modelo usado por desktop.

## Arquitectura propuesta

- Framework: React Native con Expo
- Lenguaje: TypeScript
- Base local: WatermelonDB o SQLite
- Navegacion: Expo Router
- Sync: pull/push con cola de cambios

## Modelo offline-first

No basta con cachear respuestas. La app necesita una base local y un protocolo de sincronizacion.

- Pull: descargar clientes, prestamos, pagos y cambios remotos
- Push: subir transacciones nuevas y actualizaciones pendientes
- Resolucion de conflictos:
  - cambios generales: last write wins con `updatedAt`
  - transacciones de dinero: append-only siempre que sea posible

## Fases sugeridas

### Fase 1. Base del proyecto
- [ ] Crear workspace mobile
- [ ] Configurar TypeScript
- [ ] Definir esquema local alineado con Prisma
- [ ] Preparar autenticacion JWT

### Fase 2. Contrato de sincronizacion
- [ ] Definir endpoint `/api/sync`
- [ ] Diseñar payloads de clientes, prestamos y transacciones
- [ ] Asegurar soporte de `RUT`, direccion y telefono
- [ ] Definir estrategia de conflictos

### Fase 3. UI operativa
- [ ] Dashboard simple para cobrador
- [ ] Lista de clientes buscable offline
- [ ] Detalle de prestamo
- [ ] Registro de pago offline

### Fase 4. Integracion con desktop
- [ ] Validar que desktop y mobile compartan modelo
- [ ] Verificar que las importaciones/exportaciones no rompan sincronizacion
- [ ] Probar flujos mixtos desktop -> mobile -> desktop

## Riesgos

| Riesgo | Mitigacion |
|---|---|
| Conflictos de edicion | versionado por `updatedAt` y reglas por entidad |
| Perdida de transacciones | outbox persistente y confirmacion explicita del servidor |
| Modelo divergente con desktop | usar Prisma y Zod como contrato fuente |
| Crear clientes incompletos desde mobile | exigir `RUT`, direccion y telefono igual que en desktop cuando aplique |

## Punto de reanudacion recomendado

Cuando la beta desktop este cerrada:

1. actualizar el grafo del proyecto,
2. documentar el contrato de sync,
3. abrir workspace mobile,
4. empezar por autenticacion + clientes offline.

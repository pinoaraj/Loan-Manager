# Plan de despliegue y estado actual: Loan Manager Desktop

## Foco actual

- Producto principal: app local para Windows con Electron + React + Express + Prisma/SQLite.
- Producto siguiente: exploracion Android con integracion futura, pero no es la prioridad de esta beta.

## Estado actual del escritorio

1. Frontend
   - `vite build` compila correctamente.
   - La navegacion principal ya fue revisada en navegador embebido con backend local real.
2. Backend
   - La API opera con validaciones, autenticacion y pruebas automatizadas.
   - `npm test` en `server/` ya cubre el flujo principal real.
3. Desktop
   - `electron-builder` genera version `win-unpacked` validada de nuevo el `2026-06-01`.
   - `desktop/main.cjs` levanta el backend local en `3011`.
   - El healthcheck del backend empaquetado ahora espera hasta `45s`.
   - El log operativo del desktop queda en `%AppData%\\loan-manager\\debug-log.txt`.
4. Base de datos portable
   - En produccion, Electron mueve la DB a `AppData`.
5. Migraciones
   - El arranque empaquetado ejecuta `prisma migrate deploy`.
   - Si la migracion falla en build empaquetado, la app ya no continua con un esquema desactualizado.
6. Documentos legales
   - `Pagare` usa la plantilla `pagare_template_sc.docx`.
   - `Mutuo` usa la plantilla `mutuo_template_sc.doc`.
   - El llenado usa nombre, `RUT` y direccion del cliente.
7. UX operativa
   - Las alertas y vistas de cobranza abren la cuota exacta por `paymentId`.
   - El modal de pago profundo ya cierra al primer click sin reabrirse por la URL.
   - Se eliminaron codigos internos visibles en listados y cabeceras, y se unifico el formateo monetario en vistas clave.
   - La ruta directa `#/loans/new` ya no cae en dashboard ni en estados inestables.
   - El detalle del prestamo, listados, cobranza, calendarios y documentos usan fecha normalizada sin corrimiento de un dia.
8. Branding
   - Los assets `PNG`, `ICO` y `SVG` del icono de la app ya quedaron alineados con la identidad actual de Loan Manager.

## Mejoras cerradas para beta desktop

- [x] Cliente con `RUT` integrado en alta, edicion, detalle, busqueda e importacion.
- [x] Exportacion Excel completa desde backend, no desde una pagina parcial del frontend.
- [x] Busqueda global de clientes desde backend.
- [x] Historial de transacciones y pagos parciales estable.
- [x] Bloqueo de pagos invalidos y sobrepagos.
- [x] Suma correcta de pagos parciales + pago final en backend sin concatenacion de `Decimal`.
- [x] Recalculo bloqueado cuando existen transacciones reales.
- [x] Plantillas legales conectadas al flujo desktop.
- [x] Migraciones Prisma bloqueantes en app empaquetada.
- [x] `lint`, `vitest`, pruebas backend y `build` pasando.
- [x] `electron:build` generando instalador y `win-unpacked`.
- [x] Warnings de Fast Refresh eliminados.
- [x] Modal de pago profundo cerrando al primer click.
- [x] Icono desktop actualizado y consistente en assets principales.
- [x] Revisiones visuales de pestanas principales, iconos y legibilidad en escritorio y vista movil.

## Riesgos aun vigilados

1. QA legal de formato
   - Los textos y autollenado ya salen desde plantillas reales, pero conviene seguir revisando formato final con casos de clientes reales antes de version estable.
2. Tamano del bundle
   - El build sigue siendo valido, pero hay chunks pesados por PDF/XLSX/charting.
3. Instalador NSIS
   - El build actual dejo `LoanManager-Setup-1.0.0.exe` junto al paquete `loan-manager-1.0.0-x64.nsis.7z`; antes de distribuir fuera del entorno local conviene validar ese artefacto final como paquete de entrega.
4. Datos historicos
   - Cualquier instalacion desktop antigua sin CLI o con entorno tocado podria exponer problemas locales propios de esa maquina; el arranque ahora falla de forma segura en vez de seguir silenciosamente.
5. QA en multiples equipos
   - El build local y el ejecutable empaquetado funcionan, pero la beta todavia conviene validarla al menos en una segunda maquina Windows antes de llamarla "lista para publico amplio".

## Validacion actual

- `npm run lint`: OK
- `npx vitest run`: OK
- `server/npm test`: OK
- `npm run build`: OK
- `npm run rebuild-desktop`: OK
- `graphify update .`: OK
- QA visual embebido: rutas principales cargando con backend real
- QA final web: login, dashboard, clientes, detalle cliente, nuevo prestamo, detalle prestamo, pago parcial, cobranza, documentos legales, calculadora e importacion/exportacion validados
- QA final web adicional: `#/loans/new` por URL directa validado despues del refactor de rutas
- QA final desktop: `win-unpacked/Loan Manager.exe` inicia, ejecuta backend local en `3011` y responde `200` en `/api/health`
- QA backend desktop: pago parcial seguido de pago final deja `paidAmount` exacto, `status = Paid` y `transactions = 2`

## Go / No-Go beta

Veredicto actual: **Go para beta controlada en Windows**.

Esto significa:

1. el producto ya puede probarse con usuarios reales en un grupo pequeno,
2. no hay bloqueadores tecnicos abiertos en el flujo principal,
3. aun no conviene venderlo como release estable hasta ampliar QA de escritorio en mas de una maquina y terminar la revision legal/visual de documentos.

## Graphify

El grafo local debe mantenerse como parte del cierre de cada mejora.

Comandos base:

```bash
graphify update .
graphify query "What connects Electron startup to Prisma migrations?"
graphify explain useLoans
```

Referencia actual:

- `graphify-out/GRAPH_REPORT.md`

## Siguiente hito

Cuando esta beta desktop quede completamente cerrada:

1. publicar el estado final en GitHub,
2. congelar alcance beta,
3. abrir la planificacion Android,
4. definir el contrato de integracion desktop <-> mobile.

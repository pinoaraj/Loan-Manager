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
   - `electron-builder` genera instalador y version `win-unpacked`.
   - `desktop/main.cjs` levanta el backend local en `3011`.
4. Base de datos portable
   - En produccion, Electron mueve la DB a `AppData`.
5. Migraciones
   - El arranque empaquetado ejecuta `prisma migrate deploy`.
   - Si la migracion falla en build empaquetado, la app ya no continua con un esquema desactualizado.
6. Documentos legales
   - `Pagare` usa la plantilla `pagare_template_sc.docx`.
   - `Mutuo` usa la plantilla `mutuo_template_sc.doc`.
   - El llenado usa nombre, `RUT` y direccion del cliente.

## Mejoras cerradas para beta desktop

- [x] Cliente con `RUT` integrado en alta, edicion, detalle, busqueda e importacion.
- [x] Exportacion Excel completa desde backend, no desde una pagina parcial del frontend.
- [x] Busqueda global de clientes desde backend.
- [x] Historial de transacciones y pagos parciales estable.
- [x] Bloqueo de pagos invalidos y sobrepagos.
- [x] Recalculo bloqueado cuando existen transacciones reales.
- [x] Plantillas legales conectadas al flujo desktop.
- [x] Migraciones Prisma bloqueantes en app empaquetada.
- [x] `lint`, `vitest`, pruebas backend y `build` pasando.
- [x] Warnings de Fast Refresh eliminados.

## Riesgos aun vigilados

1. QA legal de formato
   - Los textos y autollenado ya salen desde plantillas reales, pero conviene seguir revisando formato final con casos de clientes reales antes de version estable.
2. Tamano del bundle
   - El build sigue siendo valido, pero hay chunks pesados por PDF/XLSX/charting.
3. Datos historicos
   - Cualquier instalacion desktop antigua sin CLI o con entorno tocado podria exponer problemas locales propios de esa maquina; el arranque ahora falla de forma segura en vez de seguir silenciosamente.

## Validacion actual

- `npm run lint`: OK
- `npx vitest run`: OK
- `server/npm test`: OK
- `npm run build`: OK
- `graphify update .`: OK
- QA visual embebido: rutas principales cargando con backend real

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

# Plan de Despliegue y Estado Actual: Loan Manager Desktop

## Foco actual
- **Producto principal**: app local para PC con **Electron + React + Express + Prisma/SQLite**.
- **Producto secundario**: app Android offline-first. Sigue documentada, pero no es la prioridad actual.

## Estado actual del escritorio
1. **Frontend (React + Vite)**  
   El build de producción compila correctamente y genera `dist/`.
2. **Backend (Express + Prisma)**  
   La API está operativa, con validaciones Zod y SQLite como base portátil.
3. **Desktop (Electron)**  
   El empaquetado `rebuild-desktop` genera `release/win-unpacked/Loan Manager.exe`.
4. **Base de datos portable**  
   En producción, Electron mueve la DB a `AppData` (`app.getPath('userData')`) para evitar problemas de permisos.
5. **Primer arranque / migraciones**  
   El proceso principal ya ejecuta `prisma migrate deploy` antes de levantar el backend empaquetado.
6. **Dependencias de backend empaquetadas**  
   El build ahora incluye `server/node_modules`, Prisma CLI y engines dentro de `release/win-unpacked/resources/server/`.

## Mejoras ya cerradas
- [x] Ruta dinámica de SQLite para Electron/AppData.
- [x] Ejecución de migraciones Prisma al iniciar la app empaquetada.
- [x] Inclusión de Prisma CLI y engines en el paquete desktop.
- [x] Historial de transacciones para pagos parciales en detalle de préstamo.
- [x] Validación estricta de `loanType` (`Fixed | Simple`) en backend.
- [x] Endpoint AI base `/api/ai/risk-analysis`.

## Pendientes reales para desktop
1. **Prueba manual del ejecutable en entorno limpio**  
   Validar que `Loan Manager.exe` abre, crea DB, ejecuta migraciones y conecta frontend-backend sin ayuda del entorno de desarrollo.
2. **Tests del backend / flujo principal**  
   `server/package.json` todavía no tiene una suite real en `npm test`.
3. **Revisión legal y de contenido de documentos**  
   El mapeo técnico de contrato/pagaré/recibo ya está mejorado, pero la plantilla del pagaré todavía necesita revisión de texto y formato legal.
4. **Optimización del bundle frontend**  
   Vite sigue advirtiendo chunks grandes en build de producción.

## Integración AI ya iniciada
La integración dejó de ser solo idea:
- Dependencia instalada: `@google/genai`
- Ruta existente: `/api/ai/risk-analysis`
- Modo offline/degradado: respuesta mock si no existe `GEMINI_API_KEY`

## Graphify
Estado del grafo actualizado al **25 de mayo de 2026**:
- `253 nodes`
- `252 edges`
- `76 communities` detectadas internamente por la actualización

Comandos útiles para ahorrar pasos:
- `graphify update .`  
  Refresca el grafo local sin costo de API.
- `graphify watch .`  
  Reconstuye el grafo automáticamente mientras cambias código.
- `graphify query "pregunta"`  
  Sirve para inspeccionar relaciones sin abrir `graph.json`.
- `graphify cluster-only .`  
  Regenera comunidades/reporte sobre un grafo existente.

## Próximos pasos recomendados
1. Probar `release/win-unpacked/Loan Manager.exe` en una máquina o perfil limpio.
2. Agregar pruebas del flujo crear cliente -> crear préstamo -> registrar pago.
3. Revisar plantilla legal del pagaré.
4. Optimizar tamaño del bundle frontend.
5. Después de eso, retomar Android si vuelve a ser prioridad.

# Plan de Despliegue y Funcionalidad: Loan Manager (100% Operable)

## Estado Actual de la Aplicación
1. **Frontend (React + Vite)**: El build de producción se genera exitosamente sin errores fatales (18.91s).
2. **Backend (Express + Prisma)**: Se cuenta con una API estructurada y con los tipos validados (Zod). La base de datos es SQLite (`dev.db`), la cual es 100% portable a cualquier PC.
3. **Escritorio (Electron)**: Cuenta con los scripts listos (`rebuild-desktop`, `electron:build`) para generar el empaquetado final (`.exe`).

## Qué falta para el 100% de Instalación en cualquier PC:
1. **Puesta a punto de `.env`**: Asegurarse de que en producción (Electron), la ruta de la base de datos apunte dinámicamente a la carpeta `AppData` del usuario de Windows para que SQLite no tire error de permisos (Read-Only).
2. **Script de "Primer Arranque"**: Cuando el `.exe` o el backend arranque por primera vez, asegurar que corra `npx prisma migrate deploy` si la base de datos no está inicializada.
3. **Tests**: Falta escribir los test end-to-end de creación de préstamo y cliente (están lanzando "no test specified" en el server).

---

## 🤖 Integración Propuesta: Gemma 4 / GenAI
Como solicitaste, he analizado dónde integraríamos **Gemma 4** (o la familia de modelos abiertos de Google):

### Casos de Uso en Loan Manager:
1. **Evaluador de Riesgo Crediticio**:
   Al crear un préstamo, enviar la metadata del cliente (edad, préstamos pasados pagados/en mora, salario si lo hay) a Gemma 4 para obtener un "Score de Riesgo" y una recomendación sobre si aprobar el crédito o ajustar la tasa de interés.
2. **Asistente de Colecciones (Chatbot)**:
   Un input en el Dashboard donde el usuario pregunte en lenguaje natural: *"¿Quiénes están atrasados con los pagos esta semana?"* y Gemma 4 transforme esto en consultas al backend y responda con los clientes específicos y el guion de cobro recomendado.

### Pasos Técnicos para la Integración:
1. Hemos instalado la SDK oficial `@google/genai` en el backend.
2. Crearemos una ruta `/api/ai/risk-analysis` en Express.
3. El frontend consumirá esta ruta en `NewLoan.jsx` y mostrará un Badge verde/rojo ("Gemma 4: Riesgo Bajo") usando llamadas a la API de Vertex AI o a un endpoint local (como Ollama) si queremos que Gemma corra 100% offline.

---

## Siguientes Pasos (Ejecución Autónoma)
1. Escribir pruebas unitarias iniciales para el Backend (`npm test`).
2. Implementar la conexión de la API AI para sentar las bases de Gemma 4.
3. Ajustar el empaquetado de Electron (`main.cjs`) para asegurar portabilidad de la base de datos de Prisma en cualquier PC.
4. Finalizar con el despliegue al repositorio GitHub.

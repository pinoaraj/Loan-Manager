# Plan: Validación y Sincronización de Tipos Frontend-Backend

## 1. Análisis de Contexto
- **Frontend (`NewLoan.jsx`)**: El objeto `formData` envía 10 campos clave: `clientId`, `amount`, `interestRate`, `durationMonths`, `startDate`, `frequency`, `loanType`, `graceDays`, `lateFeeType` y `lateFeeValue`. Los montos y días son convertidos apropiadamente a números antes del envío.
- **Backend (`server/middleware/validation.js`)**: El esquema `loanSchema` de Zod recibe estos campos y los valida.

## 2. Hallazgos (Brainstorming Rápido)
✅ **Lo que ya coincide perfectamente:**
- `amount`, `interestRate`, `durationMonths`, `graceDays`, `lateFeeValue` son validados como `number` en el backend y se envían parseados desde el frontend.
- `startDate` acepta el formato ISO y el `YYYY-MM-DD` que envía el frontend.
- `frequency` (Weekly, Biweekly, Monthly) y `lateFeeType` (Fixed, Percent) coinciden como Enums de Zod.

⚠️ **Oportunidad de Mejora Estricta:**
- `loanType` en Zod está definido de forma laxa como `z.string().optional()`. En el frontend (`NewLoan.jsx`), los tipos definidos son explícitamente `'Fixed'` y `'Simple'`. Para asegurar una coincidencia *exacta*, deberíamos volver estricto el backend con un Enum.

## 3. Implementación
1. Modificar `server/middleware/validation.js`.
2. Actualizar `loanType: z.string().optional()` a `loanType: z.enum(['Fixed', 'Simple']).optional()`.
3. Ejecutar los scripts de verificación (Lint, Seguridad).

## 4. Agentes Asignados (Orquestación)
- `backend-specialist`: Actualizar el archivo de validación de Zod en Node.js.
- `security-auditor`: Validar que la restricción previene inyección o valores no deseados en la DB.
- `test-engineer`: Verificar que la aplicación siga pasando las validaciones estáticas.

const { z } = require('zod');

// Middleware factory
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation Error',
                details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
            });
        }
        res.status(500).json({ error: 'Internal Validation Error' });
    }
};

// Schemas

const clientSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal(''))
});

const loanSchema = z.object({
    clientId: z.string(), // Removed strict UUID check as Prisma uses CUIDs
    amount: z.number().positive('El monto debe ser positivo'),
    interestRate: z.number().min(0, 'La tasa no puede ser negativa'),
    durationMonths: z.number().int().positive('La duración debe ser positiva'),
    startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')), // Allow ISO or YYYY-MM-DD
    frequency: z.enum(['Weekly', 'Biweekly', 'Monthly']),
    loanType: z.enum(['Fixed', 'Simple']).optional(),
    graceDays: z.number().int().min(0).optional(),
    lateFeeType: z.enum(['Fixed', 'Percent']).optional(),
    lateFeeValue: z.number().min(0).optional()
});

const paymentSchema = z.object({
    amount: z.number().positive('El monto debe ser positivo'),
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')).optional(),
    method: z.string().optional(),
    note: z.string().optional()
});

module.exports = {
    validate,
    clientSchema,
    loanSchema,
    paymentSchema
};

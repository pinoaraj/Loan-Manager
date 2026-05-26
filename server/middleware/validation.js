const { z } = require('zod');

const rutSchema = z
    .string()
    .trim()
    .regex(/^\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]$/, 'RUT invalido. Usa un formato como 12.345.678-9')
    .transform((value) => value.toUpperCase());

const frequencySchema = z.preprocess(
    (value) => {
        if (typeof value !== 'string') return value;
        const normalized = value.trim().toLowerCase();
        if (normalized === 'biweekly') return 'bi-weekly';
        return normalized;
    },
    z.enum(['weekly', 'bi-weekly', 'monthly'])
);

const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            const details = error.issues || error.errors || [];
            return res.status(400).json({
                error: 'Validation Error',
                details: details.map((item) => ({ path: item.path.join('.'), message: item.message }))
            });
        }
        res.status(500).json({ error: 'Internal Validation Error' });
    }
};

const clientSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    rut: rutSchema,
    email: z.string().email('Email invalido').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal(''))
});

const loanSchema = z.object({
    clientId: z.string(),
    amount: z.number().positive('El monto debe ser positivo'),
    interestRate: z.number().min(0, 'La tasa no puede ser negativa'),
    durationMonths: z.number().int().positive('La duracion debe ser positiva'),
    startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha invalida')),
    frequency: frequencySchema,
    loanType: z.enum(['Fixed', 'Simple']).optional(),
    graceDays: z.number().int().min(0).optional(),
    lateFeeType: z.enum(['Fixed', 'Percent']).optional(),
    lateFeeValue: z.number().min(0).optional()
});

const paymentSchema = z.object({
    amount: z.number().positive('El monto debe ser positivo'),
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha invalida')).optional(),
    method: z.string().optional(),
    note: z.string().optional()
});

module.exports = {
    validate,
    clientSchema,
    loanSchema,
    paymentSchema
};

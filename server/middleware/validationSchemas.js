const { z } = require('zod');

const rutSchema = z
    .string()
    .trim()
    .regex(/^\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]$/, 'Invalid RUT format')
    .transform((value) => value.toUpperCase());

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format (YYYY-MM-DD)');
const frequencySchema = z.preprocess(
    (value) => {
        if (typeof value !== 'string') return value;
        const normalized = value.trim().toLowerCase();
        if (normalized === 'biweekly') return 'bi-weekly';
        return normalized;
    },
    z.enum(['weekly', 'bi-weekly', 'monthly']).default('monthly')
);

const importClientSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Client name is required'),
    rut: rutSchema.optional(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal(''))
});

const importLoanSchema = z.object({
    clientId: z.string().min(1, 'Client ID is required for a loan'),
    clientName: z.string().optional(),
    amount: z.coerce.number().positive('Loan amount must be positive'),
    interestRate: z.coerce.number().min(0, 'Interest rate cannot be negative'),
    durationMonths: z.coerce.number().int().positive('Duration must be a positive integer'),
    startDate: dateSchema,
    frequency: frequencySchema,
    loanType: z.enum(['Fixed', 'Simple']).default('Fixed'),
    graceDays: z.coerce.number().int().min(0).optional(),
    lateFeeType: z.enum(['Fixed', 'Percent']).optional(),
    lateFeeValue: z.coerce.number().min(0).optional()
});

const importDataSchema = z.object({
    clients: z.array(importClientSchema),
    loans: z.array(importLoanSchema)
});

module.exports = {
    importClientSchema,
    importLoanSchema,
    importDataSchema
};

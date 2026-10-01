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
    rut: rutSchema,
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
    source: z.literal('spreadsheet').default('spreadsheet'),
    clients: z.array(importClientSchema),
    loans: z.array(importLoanSchema)
});

const optionalStringSchema = z.string().optional().nullable().or(z.literal(''));
const optionalRutSchema = rutSchema.optional().nullable().or(z.literal(''));

const portableClientSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1, 'Client name is required'),
    rut: optionalRutSchema,
    email: optionalStringSchema,
    phone: optionalStringSchema,
    address: optionalStringSchema,
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
});

const portableLoanSchema = z.object({
    id: z.string().min(1),
    clientId: z.string().min(1, 'Client ID is required for a loan'),
    amount: z.coerce.number().positive('Loan amount must be positive'),
    interestRate: z.coerce.number().min(0, 'Interest rate cannot be negative'),
    durationMonths: z.coerce.number().int().positive('Duration must be a positive integer'),
    startDate: z.string().min(1, 'Loan start date is required'),
    frequency: frequencySchema,
    loanType: z.enum(['Fixed', 'Simple']).default('Fixed'),
    status: z.enum(['Active', 'Paid', 'Overdue', 'Closed']).optional(),
    isPaused: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
});

const portablePaymentSchema = z.object({
    id: z.string().min(1),
    loanId: z.string().min(1),
    amount: z.coerce.number().nonnegative(),
    lateFee: z.coerce.number().nonnegative().default(0),
    paidAmount: z.coerce.number().nonnegative().default(0),
    dueDate: z.string().min(1),
    status: z.enum(['Pending', 'Partial', 'Paid', 'Overdue']).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
});

const portablePaymentTransactionSchema = z.object({
    id: z.string().min(1),
    paymentId: z.string().min(1),
    amount: z.coerce.number().positive(),
    date: z.string().min(1),
    method: z.string().optional(),
    note: z.string().optional().nullable(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    clientMutationId: z.string().optional().nullable()
});

const portableOutboxSchema = z.object({
    id: z.string().min(1),
    entity: z.string(),
    operation: z.string(),
    payload: z.record(z.any()),
    status: z.enum(['pending', 'applied', 'rejected']),
    errorCode: z.string().optional().nullable(),
    errorMessage: z.string().optional().nullable(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
});

const portableImportSchema = z.object({
    source: z.literal('mobiloan-portable'),
    exportedAt: z.string().min(1),
    clients: z.array(portableClientSchema),
    loans: z.array(portableLoanSchema),
    payments: z.array(portablePaymentSchema),
    paymentTransactions: z.array(portablePaymentTransactionSchema),
    pendingOutbox: z.array(portableOutboxSchema).optional().default([])
});

const unifiedImportSchema = z.discriminatedUnion('source', [importDataSchema, portableImportSchema]);

module.exports = {
    importClientSchema,
    importLoanSchema,
    importDataSchema: unifiedImportSchema
};

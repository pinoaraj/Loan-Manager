const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { validate, loanSchema } = require('../middleware/validation');
const { calculateAmortization } = require('../utils/amortization');
const { checkAndApplyLateFees } = require('../utils/fees');
const { authenticateToken } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET all loans with pagination, search, and filtering
router.get('/', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000;
        const search = req.query.search || '';
        const status = req.query.status || 'All';

        const skip = (page - 1) * limit;

        const where = {};

        if (status !== 'All') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { id: { contains: search } }, // SQLite contains is case-sensitive usually? Prisma handles case-insensitive option in newer versions
                {
                    client: {
                        name: { contains: search } // Add mode: 'insensitive' if Postgres, SQLite default depends.
                    }
                }
            ];
        }

        const [total, loans] = await Promise.all([
            prisma.loan.count({ where }),
            prisma.loan.findMany({
                where,
                skip,
                take: limit,
                include: {
                    client: true,
                    payments: true
                },
                orderBy: { startDate: 'desc' }
            })
        ]);

        res.json({
            data: loans,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single loan
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        let loan = await prisma.loan.findUnique({
            where: { id: req.params.id },
            include: {
                client: true,
                payments: {
                    include: { transactions: true }
                }
            }
        });

        if (!loan) return res.status(404).json({ error: 'Loan not found' });

        // Check and apply late fees automatically
        loan = await checkAndApplyLateFees(loan, prisma);

        res.json(loan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create loan
router.post('/', authenticateToken, validate(loanSchema), async (req, res) => {
    try {
        const { clientId, amount, interestRate, durationMonths, startDate, loanType, frequency, graceDays, lateFeeType, lateFeeValue } = req.body;

        const schedule = calculateAmortization(
            parseFloat(amount),
            parseFloat(interestRate),
            parseInt(durationMonths),
            startDate,
            frequency || 'monthly',
            loanType || 'Fixed'
        );

        const result = await prisma.$transaction(async (tx) => {
            const loan = await tx.loan.create({
                data: {
                    clientId,
                    amount: parseFloat(amount),
                    interestRate: parseFloat(interestRate),
                    durationMonths: parseInt(durationMonths),
                    startDate: new Date(startDate),
                    loanType: loanType || 'Fixed',
                    frequency: frequency || 'monthly',
                    graceDays: parseInt(graceDays) || 3,
                    lateFeeType: lateFeeType || 'Fixed',
                    lateFeeValue: parseFloat(lateFeeValue) || 0,
                    status: 'Active'
                }
            });

            const payments = await Promise.all(schedule.map(p =>
                tx.payment.create({
                    data: {
                        loanId: loan.id,
                        dueDate: p.dueDate,
                        amount: p.amount,
                        principal: p.principal,
                        interest: p.interest,
                        status: p.status
                    }
                })
            ));

            return { loan, payments };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Recalculate loan
router.post('/:id/recalculate', authenticateToken, async (req, res) => {
    try {
        const loanId = req.params.id;
        const loan = await prisma.loan.findUnique({ where: { id: loanId } });
        if (!loan) return res.status(404).json({ error: 'Loan not found' });

        const schedule = calculateAmortization(
            loan.amount,
            loan.interestRate,
            loan.durationMonths,
            loan.startDate,
            loan.frequency,
            loan.loanType
        );

        await prisma.$transaction(async (tx) => {
            await tx.payment.deleteMany({ where: { loanId } });

            await Promise.all(schedule.map(p =>
                tx.payment.create({
                    data: {
                        loanId,
                        dueDate: p.dueDate,
                        amount: p.amount,
                        principal: p.principal,
                        interest: p.interest,
                        status: 'Pending'
                    }
                })
            ));
        });

        res.json({ message: 'Recalculated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update loan status (patch)
router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const loan = await prisma.loan.update({
            where: { id: req.params.id },
            data: { status }
        });
        res.json(loan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

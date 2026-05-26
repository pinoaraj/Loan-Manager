const express = require('express');
const router = express.Router();
const { startOfDay, endOfDay, addDays, differenceInCalendarDays } = require('date-fns');
const { authenticateToken } = require('../middleware/auth');
const { checkAndApplyLateFees } = require('../utils/fees');
const prisma = require('../lib/prisma');

const ACTIVE_PAYMENT_STATUSES = ['Pending', 'Partial', 'Overdue'];

const getRemainingAmount = (payment) => {
    const totalDue = Number(payment.amount) + Number(payment.lateFee || 0);
    const paidAmount = Number(payment.paidAmount || 0);
    return Math.max(0, totalDue - paidAmount);
};

const getLoanStatusFromPayments = (payments) => {
    if (payments.length > 0 && payments.every((payment) => payment.status === 'Paid')) {
        return 'Paid';
    }

    if (payments.some((payment) => payment.status === 'Overdue')) {
        return 'Overdue';
    }

    return 'Active';
};

const syncLoansForDashboard = async () => {
    const loans = await prisma.loan.findMany({
        include: {
            payments: true
        }
    });

    return Promise.all(loans.map((loan) => checkAndApplyLateFees(loan, prisma)));
};

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const [loans, totalClients, monthlyCollectionAgg] = await Promise.all([
            syncLoansForDashboard(),
            prisma.client.count(),
            prisma.transaction.aggregate({
                _sum: { amount: true },
                where: {
                    date: {
                        gte: startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
                        lte: endOfDay(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))
                    }
                }
            })
        ]);

        const computedLoans = loans.map((loan) => ({
            ...loan,
            computedStatus: getLoanStatusFromPayments(loan.payments)
        }));

        const totalActiveLoans = computedLoans.filter((loan) => loan.computedStatus === 'Active').length;
        const totalPaidLoans = computedLoans.filter((loan) => loan.computedStatus === 'Paid').length;
        const totalOverdueLoans = computedLoans.filter((loan) => loan.computedStatus === 'Overdue').length;
        const totalLent = computedLoans
            .filter((loan) => loan.computedStatus !== 'Paid')
            .reduce((sum, loan) => sum + Number(loan.amount), 0);

        const statusData = [
            { name: 'Activos', value: totalActiveLoans, color: '#3b82f6' },
            { name: 'Pagados', value: totalPaidLoans, color: '#10b981' },
            { name: 'Vencidos', value: totalOverdueLoans, color: '#ef4444' },
        ].filter((item) => item.value > 0);

        const healthScoreBase = totalActiveLoans + totalOverdueLoans;
        const healthScore = healthScoreBase > 0
            ? Math.round((totalActiveLoans / healthScoreBase) * 100)
            : 100;

        const parAmount = computedLoans
            .filter((loan) => loan.computedStatus === 'Overdue')
            .reduce((sum, loan) => sum + Number(loan.amount), 0);

        const monthStart = startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
        const monthEnd = endOfDay(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
        const expectedCollection = computedLoans
            .flatMap((loan) => loan.payments)
            .filter((payment) => payment.status !== 'Paid')
            .filter((payment) => {
                const dueDate = new Date(payment.dueDate);
                return dueDate >= monthStart && dueDate <= monthEnd;
            })
            .reduce((sum, payment) => sum + getRemainingAmount(payment), 0);

        res.json({
            totalActiveLoans,
            totalLent,
            statusData,
            totalClients,
            monthlyCollection: monthlyCollectionAgg._sum.amount || 0,
            expectedCollection,
            healthScore,
            parAmount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/dashboard/alerts
router.get('/alerts', authenticateToken, async (req, res) => {
    try {
        const today = startOfDay(new Date());
        const nextThirtyDays = endOfDay(addDays(today, 30));

        const payments = await prisma.payment.findMany({
            where: {
                status: { in: ACTIVE_PAYMENT_STATUSES },
                OR: [
                    { dueDate: { lt: today } },
                    { dueDate: { gte: today, lte: nextThirtyDays } }
                ]
            },
            include: {
                loan: {
                    include: {
                        client: {
                            select: { name: true, phone: true }
                        }
                    }
                }
            },
            orderBy: { dueDate: 'asc' }
        });

        const alerts = payments
            .map((payment) => {
                const dueDate = startOfDay(new Date(payment.dueDate));
                const isOverdue = dueDate < today;
                const diffDays = Math.abs(differenceInCalendarDays(today, dueDate));

                return {
                    type: isOverdue ? 'overdue' : 'upcoming',
                    loanId: payment.loanId,
                    paymentId: payment.id,
                    clientName: payment.loan.client.name,
                    clientPhone: payment.loan.client.phone,
                    amount: getRemainingAmount(payment),
                    dueDate: payment.dueDate,
                    status: payment.status,
                    daysOverdue: isOverdue ? diffDays : 0,
                    daysUntil: isOverdue ? 0 : diffDays
                };
            })
            .filter((alert) => alert.amount > 0);

        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/dashboard/projections
router.get('/projections', authenticateToken, async (req, res) => {
    try {
        const today = new Date();
        const sixMonthsLater = addDays(today, 180);

        const payments = await prisma.payment.findMany({
            where: {
                status: { in: ACTIVE_PAYMENT_STATUSES },
                dueDate: { gte: today, lte: sixMonthsLater }
            },
            orderBy: { dueDate: 'asc' }
        });

        const projections = {};
        payments.forEach((payment) => {
            const date = new Date(payment.dueDate);
            const key = date.toISOString().slice(0, 7);
            const remaining = getRemainingAmount(payment);

            if (remaining > 0) {
                projections[key] = (projections[key] || 0) + remaining;
            }
        });

        const result = Object.entries(projections)
            .map(([key, amount]) => {
                const [year, month] = key.split('-');
                const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
                const label = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
                return { month: label, amount, sortKey: key };
            })
            .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/dashboard/recent
router.get('/recent', authenticateToken, async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            take: 5,
            orderBy: { date: 'desc' },
            include: {
                payment: {
                    include: {
                        loan: {
                            include: {
                                client: {
                                    select: { name: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        const recent = transactions.map((transaction) => ({
            id: transaction.id,
            loanId: transaction.payment.loanId,
            clientName: transaction.payment.loan.client.name,
            amount: transaction.amount,
            date: transaction.date,
            method: transaction.method
        }));

        res.json(recent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

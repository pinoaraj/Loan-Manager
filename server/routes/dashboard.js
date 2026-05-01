const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { startOfDay, endOfDay, addDays } = require('date-fns');
const { authenticateToken } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const [
            totalActiveLoans,
            totalPaidLoans,
            totalOverdueLoans,
            totalLent,
            totalClients,
            monthlyCollectionAgg
        ] = await Promise.all([
            prisma.loan.count({ where: { status: 'Active' } }),
            prisma.loan.count({ where: { status: 'Paid' } }),
            prisma.loan.count({ where: { status: 'Overdue' } }),
            prisma.loan.aggregate({
                _sum: { amount: true },
                where: { status: 'Active' }
            }),
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

        const statusData = [
            { name: 'Activos', value: totalActiveLoans, color: '#3b82f6' },
            { name: 'Pagados', value: totalPaidLoans, color: '#10b981' },
            { name: 'Vencidos', value: totalOverdueLoans, color: '#ef4444' },
        ].filter(d => d.value > 0);

        // [5] monthlyCollection aggregate

        // We can't access "arguments" here in arrow function easily like that or it's messy.
        // Better to destructure all of them.

        // Let's re-write the destructuring properly:
        /*
        const [
            totalActiveLoans,
            totalPaidLoans,
            totalOverdueLoans,
            totalLent,
            totalClients,
            monthlyCollectionAgg
        ] = await Promise.all([...])
        */

        // THIS REPLACE BLOCK CONTAINS THE FIX:

        // Calculate health score (Active / (Active + Overdue))
        const activeCount = totalActiveLoans;
        const overdueCount = totalOverdueLoans;
        const totalCount = activeCount + overdueCount;
        const healthScore = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 100;

        // Portfolio at Risk (PAR) - Total amount in overdue loans
        const parAgg = await prisma.loan.aggregate({
            _sum: { amount: true },
            where: { status: 'Overdue' }
        });
        const parAmount = parAgg._sum.amount || 0;

        // Expected collection for this month
        const expectedCollectionAgg = await prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
                dueDate: {
                    gte: startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
                    lte: endOfDay(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))
                }
            }
        });
        const expectedCollection = expectedCollectionAgg._sum.amount || 0;

        res.json({
            totalActiveLoans,
            totalLent: totalLent._sum.amount || 0,
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
        const today = new Date();
        const nextWeek = addDays(today, 7);

        // Find payments that are Pending and (Overdue OR Upcoming within 7 days)
        // Note: This relies on Payment records.
        // Overdue: dueDate < today && status == Pending
        // Upcoming: dueDate >= today && dueDate <= nextWeek && status == Pending

        const payments = await prisma.payment.findMany({
            where: {
                status: 'Pending',
                OR: [
                    { dueDate: { lt: today } }, // Overdue
                    { dueDate: { gte: today, lte: nextWeek } } // Upcoming
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

        const alerts = payments.map(p => {
            const isOverdue = new Date(p.dueDate) < today;
            const diffTime = Math.abs(today - new Date(p.dueDate));
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
                type: isOverdue ? 'overdue' : 'upcoming',
                loanId: p.loanId,
                clientName: p.loan.client.name,
                clientPhone: p.loan.client.phone,
                amount: p.amount,
                dueDate: p.dueDate,
                // Calculation here is simplified, date-fns in frontend was more precise with startOfDay
                daysOverdue: isOverdue ? diffDays : 0,
                daysUntil: isOverdue ? 0 : diffDays
            };
        });

        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/dashboard/projections
router.get('/projections', authenticateToken, async (req, res) => {
    try {
        // Group pending payments by month (SQLite doesn't support complex date grouping easily in Prisma without raw query sometimes)
        // But let's fetch pending payments for next 6 months.
        const today = new Date();
        const sixMonthsLater = addDays(today, 180);

        const payments = await prisma.payment.findMany({
            where: {
                status: 'Pending',
                dueDate: { gte: today, lte: sixMonthsLater }
            },
            orderBy: { dueDate: 'asc' }
        });

        // Group by Month-Year
        const projections = {};
        payments.forEach(p => {
            const date = new Date(p.dueDate);
            const key = date.toISOString().slice(0, 7); // YYYY-MM

            // Calculate remaining amount to be collected
            const remaining = p.amount - p.paidAmount;
            if (remaining > 0) {
                projections[key] = (projections[key] || 0) + remaining;
            }
        });

        // Convert to array and format label
        const result = Object.entries(projections).map(([key, amount]) => {
            const [year, month] = key.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            const label = date.toLocaleString('en-US', { month: 'short', year: '2-digit' }); // 'Jan 26'
            return { month: label, amount, sortKey: key };
        }).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

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

        const recent = transactions.map(t => ({
            id: t.id,
            loanId: t.payment.loanId, // Expose loanId for navigation
            clientName: t.payment.loan.client.name,
            amount: t.amount,
            date: t.date,
            method: t.method
        }));

        res.json(recent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

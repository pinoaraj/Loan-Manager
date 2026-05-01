const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const excel = require('xlsx');

const prisma = new PrismaClient();

// GET /api/reports/loans
router.get('/loans', authenticateToken, async (req, res) => {
    try {
        const loans = await prisma.loan.findMany({
            include: {
                client: { select: { name: true, phone: true } },
                payments: true
            }
        });

        const reportData = loans.map(loan => {
            const totalPaid = loan.payments.reduce((acc, p) => acc + Number(p.paidAmount), 0);
            const totalDue = loan.payments.reduce((acc, p) => acc + Number(p.amount) + Number(p.lateFee), 0);
            
            return {
                'ID Préstamo': loan.id,
                'Cliente': loan.client.name,
                'Teléfono': loan.client.phone,
                'Monto Original': Number(loan.amount),
                'Tasa': Number(loan.interestRate),
                'Frecuencia': loan.frequency,
                'Estado': loan.status,
                'Fecha Inicio': loan.startDate,
                'Total Cobrado': totalPaid,
                'Total por Cobrar': totalDue,
                'Saldo Pendiente': totalDue - totalPaid
            };
        });

        const wb = excel.utils.book_new();
        const ws = excel.utils.json_to_sheet(reportData);
        excel.utils.book_append_sheet(wb, ws, 'Préstamos');
        
        const buf = excel.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Disposition', 'attachment; filename="Reporte_Prestamos.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reports/transactions
router.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            include: {
                payment: {
                    include: {
                        loan: {
                            include: { client: { select: { name: true } } }
                        }
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        const reportData = transactions.map(t => ({
            'Fecha': t.date,
            'Cliente': t.payment.loan.client.name,
            'Monto': Number(t.amount),
            'Método': t.method,
            'Nota': t.note || '',
            'ID Préstamo': t.payment.loanId
        }));

        const wb = excel.utils.book_new();
        const ws = excel.utils.json_to_sheet(reportData);
        excel.utils.book_append_sheet(wb, ws, 'Transacciones');
        
        const buf = excel.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Disposition', 'attachment; filename="Reporte_Transacciones.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

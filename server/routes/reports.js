const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const excel = require('xlsx');
const prisma = require('../lib/prisma');

// GET /api/reports/loans
router.get('/loans', authenticateToken, async (req, res) => {
    try {
        const loans = await prisma.loan.findMany({
            include: {
                client: { select: { name: true, phone: true } },
                payments: true
            }
        });

        const reportData = loans.map((loan) => {
            const totalPaid = loan.payments.reduce((acc, payment) => acc + Number(payment.paidAmount || 0), 0);
            const totalDue = loan.payments.reduce(
                (acc, payment) => acc + Number(payment.amount || 0) + Number(payment.lateFee || 0),
                0
            );

            return {
                'ID Prestamo': loan.id,
                Cliente: loan.client.name,
                Telefono: loan.client.phone,
                'Monto Original': Number(loan.amount),
                Tasa: Number(loan.interestRate),
                Frecuencia: loan.frequency,
                Estado: loan.status,
                'Fecha Inicio': loan.startDate,
                'Total Cobrado': totalPaid,
                'Total por Cobrar': totalDue,
                'Saldo Pendiente': totalDue - totalPaid
            };
        });

        const workbook = excel.utils.book_new();
        const worksheet = excel.utils.json_to_sheet(reportData);
        excel.utils.book_append_sheet(workbook, worksheet, 'Prestamos');

        const buffer = excel.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="Reporte_Prestamos.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
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

        const reportData = transactions.map((transaction) => ({
            Fecha: transaction.date,
            Cliente: transaction.payment.loan.client.name,
            Monto: Number(transaction.amount),
            Metodo: transaction.method,
            Nota: transaction.note || '',
            'ID Prestamo': transaction.payment.loanId
        }));

        const workbook = excel.utils.book_new();
        const worksheet = excel.utils.json_to_sheet(reportData);
        excel.utils.book_append_sheet(workbook, worksheet, 'Transacciones');

        const buffer = excel.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="Reporte_Transacciones.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

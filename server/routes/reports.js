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
            Nota: transaction.note || ''
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

// GET /api/reports/export-all
router.get('/export-all', authenticateToken, async (req, res) => {
    try {
        const [clients, loans] = await Promise.all([
            prisma.client.findMany({
                orderBy: { name: 'asc' },
                include: {
                    loans: true
                }
            }),
            prisma.loan.findMany({
                orderBy: { startDate: 'desc' },
                include: {
                    client: { select: { name: true } },
                    payments: true
                }
            })
        ]);

        const clientRows = clients.map((client) => ({
            Nombre: client.name,
            RUT: client.rut || '',
            Email: client.email || '',
            Telefono: client.phone || '',
            Direccion: client.address || '',
            PrestamosActivos: client.loans.filter((loan) => loan.status !== 'Paid').length
        }));

        const loanRows = loans.map((loan) => {
            const totalPaid = loan.payments.reduce((acc, payment) => acc + Number(payment.paidAmount || 0), 0);
            const totalDue = loan.payments.reduce(
                (acc, payment) => acc + Number(payment.amount || 0) + Number(payment.lateFee || 0),
                0
            );

            return {
                Cliente: loan.client?.name || '',
                MontoOriginal: Number(loan.amount),
                TasaInteres: Number(loan.interestRate),
                Frecuencia: loan.frequency,
                Tipo: loan.loanType,
                Estado: loan.status,
                FechaInicio: loan.startDate,
                Pagado: totalPaid,
                Pendiente: totalDue - totalPaid
            };
        });

        const workbook = excel.utils.book_new();
        excel.utils.book_append_sheet(workbook, excel.utils.json_to_sheet(clientRows), 'Clientes');
        excel.utils.book_append_sheet(workbook, excel.utils.json_to_sheet(loanRows), 'Prestamos');

        const buffer = excel.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="LoanManager_Export_Completo.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

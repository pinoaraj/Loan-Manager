const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validate, clientSchema } = require('../middleware/validation');
const prisma = require('../lib/prisma');

// GET all clients with pagination
router.get('/', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000; // Default high for backward compatibility initially
        const skip = (page - 1) * limit;
        const search = String(req.query.search || '').trim();
        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { id: { contains: search, mode: 'insensitive' } }
                ]
            }
            : undefined;

        const [total, clients] = await Promise.all([
            prisma.client.count({ where }),
            prisma.client.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                include: {
                    loans: true // Keep including loans for now as frontend expects it
                }
            })
        ]);

        res.json({
            data: clients,
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

// Create client
router.post('/', authenticateToken, validate(clientSchema), async (req, res) => {
    try {
        const client = await prisma.client.create({
            data: req.body
        });
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single client with related loans
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const client = await prisma.client.findUnique({
            where: { id: req.params.id },
            include: {
                loans: {
                    include: {
                        payments: {
                            include: { transactions: true }
                        }
                    },
                    orderBy: { startDate: 'desc' }
                }
            }
        });

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.json(client);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update client
router.put('/:id', authenticateToken, validate(clientSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const client = await prisma.client.update({
            where: { id },
            data: req.body
        });
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete client
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const clientId = req.params.id;

        // Check for associated loans
        const loanCount = await prisma.loan.count({
            where: { clientId: clientId }
        });

        if (loanCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete client with existing loans. Please delete the loans first.'
            });
        }

        await prisma.client.delete({
            where: { id: clientId }
        });

        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

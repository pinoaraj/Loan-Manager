const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// GET /api/backup
router.get('/', (req, res) => {
    try {
        const dbPath = process.env.DATABASE_URL.replace('file:', '');
        const absoluteDbPath = path.resolve(__dirname, '../', dbPath);

        if (!fs.existsSync(absoluteDbPath)) {
            return res.status(404).json({ error: 'Base de datos no encontrada.' });
        }

        const date = new Date().toISOString().split('T')[0];
        const filename = `backup-loan-manager-${date}.db`;

        res.download(absoluteDbPath, filename, (err) => {
            if (err) {
                console.error('Error downloading backup:', err);
                // Don't send another response if headers sent
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error al descargar el respaldo.' });
                }
            }
        });
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;

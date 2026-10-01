const winston = require('winston');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Resolve a writable folder for the log files. The packaged app can live in a
// read-only location such as "C:\Program Files\Loan Manager", so writing next to
// the server code is only a preference, never a requirement.
function resolveLogsDir() {
    const candidates = [
        process.env.LOAN_MANAGER_LOG_DIR,
        path.join(__dirname, '..', 'logs'),
        process.env.APPDATA ? path.join(process.env.APPDATA, 'loan-manager', 'logs') : null,
        path.join(os.tmpdir(), 'loan-manager-logs')
    ].filter(Boolean);

    for (const candidate of candidates) {
        try {
            fs.mkdirSync(candidate, { recursive: true });
            fs.accessSync(candidate, fs.constants.W_OK);
            return candidate;
        } catch {
            // Try the next candidate.
        }
    }

    return os.tmpdir();
}

const logsDir = resolveLogsDir();

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'loan-manager' },
    transports: [
        // Write all logs with level 'error' to error.log
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Write all logs to combined.log
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});

// If not in production, log to console with simple format
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }));
}

module.exports = logger;

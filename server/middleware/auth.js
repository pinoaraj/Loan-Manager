const jwt = require('jsonwebtoken');

// CRITICAL: JWT_SECRET must be set in environment variables
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('❌ FATAL ERROR: JWT_SECRET environment variable is not set!');
    console.error('Please create a .env file with: JWT_SECRET=<your-secure-random-secret>');
    console.error('Generate one with: openssl rand -base64 64');
    process.exit(1);
}

if (JWT_SECRET.length < 32) {
    console.error('❌ FATAL ERROR: JWT_SECRET must be at least 32 characters long!');
    console.error('Current length:', JWT_SECRET.length);
    console.error('Generate a secure secret with: openssl rand -base64 64');
    process.exit(1);
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken, JWT_SECRET };

import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-docs-hub';
export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Authentication token required' });
        return;
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            res.status(403).json({ error: 'Invalid or expired token' });
            return;
        }
        req.user = decoded;
        next();
    });
}
// Optional auth that doesn't block the request if token is missing (used for public/private checking)
export function optionalAuthenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        next();
        return;
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (!err) {
            req.user = decoded;
        }
        next();
    });
}
//# sourceMappingURL=auth.js.map
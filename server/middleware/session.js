const { verify } = require('../lib/jwt');

/**
 * requireSession — verifies the JWT from Authorization: Bearer header
 * Attaches req.user = { tenantId, email, plan, name } on success.
 */
function requireSession(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: true, message: 'Login required. Please include a valid session token.' });
    }
    const token = auth.slice(7);
    const payload = verify(token);
    if (!payload) {
        return res.status(401).json({ error: true, message: 'Session expired or invalid. Please log in again.' });
    }
    req.user = payload;
    next();
}

module.exports = requireSession;

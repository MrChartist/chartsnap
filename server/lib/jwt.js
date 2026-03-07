/**
 * Lightweight JWT implementation using Node's built-in crypto.
 * No external dependencies.
 */
const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || 'pixeltrade-dev-secret-2026-change-in-production';
const EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days in seconds

function base64url(str) {
    return Buffer.from(str).toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function sign(payload) {
    const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const claims = base64url(JSON.stringify({
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + EXPIRES_IN,
    }));
    const sig = crypto
        .createHmac('sha256', SECRET)
        .update(`${header}.${claims}`)
        .digest('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return `${header}.${claims}.${sig}`;
}

function verify(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, claims, sig] = parts;
    const expected = crypto
        .createHmac('sha256', SECRET)
        .update(`${header}.${claims}`)
        .digest('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    if (sig !== expected) return null;

    try {
        const payload = JSON.parse(Buffer.from(claims, 'base64').toString('utf8'));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch {
        return null;
    }
}

module.exports = { sign, verify };

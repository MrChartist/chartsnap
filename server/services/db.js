const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/chartsnap_v2.db');

let db;
try {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
} catch (error) {
    console.error('Failed to connect to SQLite V2 database:', error.message);
}

module.exports = {
    getDb: () => db,

    // ─── Tenant auth lookup (used by API key middleware) ───────────────
    findTenantByKeyHash: (keyHash) => {
        if (!db) return null;
        try {
            const result = db.prepare(`
                SELECT t.id, t.name, t.plan, t.status
                FROM api_keys k
                JOIN tenants t ON k.tenant_id = t.id
                WHERE k.key_hash = ? AND t.status = 'active'
                  AND (k.revoked_at IS NULL OR k.revoked_at > CURRENT_TIMESTAMP)
            `).get(keyHash);
            if (!result) return null;
            return { id: result.id, name: result.name, tier: result.plan, status: result.status };
        } catch (e) { console.error('DB findTenantByKeyHash:', e); return null; }
    },

    updateKeyUsageTime: (keyHash) => {
        if (!db) return;
        try {
            db.prepare(`UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE key_hash = ?`).run(keyHash);
        } catch (e) { console.error('DB updateKeyUsageTime:', e); }
    },

    logUsageEvent: (tenantId, action, pixels = 0, renderMs = 0, statusCode = 200, cacheHit = false) => {
        if (!db) return;
        try {
            db.prepare(`INSERT INTO usage_events (tenant_id, action, pixels, render_ms, status_code, cache_hit)
                VALUES (?, ?, ?, ?, ?, ?)`
            ).run(tenantId, action, pixels, renderMs, statusCode, cacheHit ? 1 : 0);
        } catch (e) { console.error('DB logUsageEvent:', e); }
    },

    // ─── User management (SaaS) ────────────────────────────────────────
    findUserByEmail: (email) => {
        if (!db) return null;
        try {
            return db.prepare(`
                SELECT u.id, u.tenant_id, u.email, u.name, u.password_hash, t.plan, t.status
                FROM users u JOIN tenants t ON u.tenant_id = t.id
                WHERE u.email = ?
            `).get(email);
        } catch (e) { console.error('DB findUserByEmail:', e); return null; }
    },

    createUser: ({ tenantId, userId, email, passwordHash, name, keyId, keyHash }) => {
        if (!db) throw new Error('Database offline');
        db.transaction(() => {
            db.prepare(`INSERT INTO tenants (id, name, plan, status) VALUES (?, ?, 'FREE', 'active')`).run(tenantId, name);
            db.prepare(`INSERT INTO users (id, tenant_id, email, name, password_hash) VALUES (?, ?, ?, ?, ?)`
            ).run(userId, tenantId, email, name, passwordHash);
            db.prepare(`INSERT INTO api_keys (id, tenant_id, key_hash, stored_plain, label) VALUES (?, ?, ?, ?, ?)`
            ).run(keyId, tenantId, keyHash, null, 'Default Key');
            // Store plain key separately for reveal (show-once on signup, then null)
            // We store a limited-time version for dashboard reveal only
            db.prepare(`UPDATE api_keys SET stored_plain = ? WHERE id = ?`).run(
                null, // will be set at signup time via a separate call below
                keyId
            );
        })();
    },

    storeApiKeyPlain: (tenantId, plain) => {
        if (!db) return;
        try {
            db.prepare(`UPDATE api_keys SET stored_plain = ? WHERE tenant_id = ? AND revoked_at IS NULL`).run(plain, tenantId);
        } catch (e) { console.error('DB storeApiKeyPlain:', e); }
    },

    getApiKeyForTenant: (tenantId) => {
        if (!db) return null;
        try {
            return db.prepare(`SELECT stored_plain, key_hash FROM api_keys WHERE tenant_id = ? AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 1`).get(tenantId);
        } catch (e) { console.error('DB getApiKeyForTenant:', e); return null; }
    },

    revokeAndReplaceKey: (tenantId, newKeyHash, newPlain) => {
        if (!db) throw new Error('Database offline');
        const crypto = require('crypto');
        const newId = 'key_' + crypto.randomBytes(8).toString('hex');
        db.transaction(() => {
            db.prepare(`UPDATE api_keys SET revoked_at = CURRENT_TIMESTAMP WHERE tenant_id = ? AND revoked_at IS NULL`).run(tenantId);
            db.prepare(`INSERT INTO api_keys (id, tenant_id, key_hash, stored_plain, label) VALUES (?, ?, ?, ?, 'Default Key')`
            ).run(newId, tenantId, newKeyHash, newPlain);
        })();
    },

    // ─── Usage analytics ──────────────────────────────────────────────
    getCallsToday: (tenantId) => {
        if (!db) return 0;
        try {
            const row = db.prepare(`SELECT COUNT(*) as cnt FROM usage_events WHERE tenant_id = ? AND date(created_at) = date('now')`).get(tenantId);
            return row ? row.cnt : 0;
        } catch (e) { return 0; }
    },

    getCallsThisMonth: (tenantId) => {
        if (!db) return 0;
        try {
            const row = db.prepare(`SELECT COUNT(*) as cnt FROM usage_events WHERE tenant_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`).get(tenantId);
            return row ? row.cnt : 0;
        } catch (e) { return 0; }
    },

    getUsageByDay: (tenantId, days = 7) => {
        if (!db) return [];
        try {
            const rows = db.prepare(`
                SELECT date(created_at) as day, COUNT(*) as calls
                FROM usage_events
                WHERE tenant_id = ?
                  AND created_at >= datetime('now', ?)
                GROUP BY day
                ORDER BY day ASC
            `).all(tenantId, `-${days} days`);
            // Fill in missing days with 0
            const result = [];
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = d.toISOString().slice(0, 10);
                const found = rows.find(r => r.day === key);
                result.push({ day: key, calls: found ? found.calls : 0 });
            }
            return result;
        } catch (e) { console.error('DB getUsageByDay:', e); return []; }
    },
};

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../data/chartsnap_v2.db');

// Ensure database file exists
let db;
try {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
} catch (error) {
    console.error('Failed to connect to SQLite V2 database:', error.message);
}

module.exports = {
    getDb: () => db,

    findTenantByKeyHash: (keyHash) => {
        if (!db) return null;
        try {
            const stmt = db.prepare(`
                SELECT t.id, t.name, t.plan, t.status 
                FROM api_keys k
                JOIN tenants t ON k.tenant_id = t.id
                WHERE k.key_hash = ? AND t.status = 'active'
                  AND (k.revoked_at IS NULL OR k.revoked_at > CURRENT_TIMESTAMP)
            `);
            const result = stmt.get(keyHash);
            if (result) {
                // Return in format expected by app
                return {
                    id: result.id,
                    name: result.name,
                    tier: result.plan,
                    status: result.status
                };
            }
            return null;
        } catch (e) {
            console.error('DB Error checking key hash:', e);
            return null;
        }
    },

    updateKeyUsageTime: (keyHash) => {
        if (!db) return;
        try {
            const stmt = db.prepare(`UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE key_hash = ?`);
            stmt.run(keyHash);
        } catch (e) {
            console.error('DB Error updating key usage:', e);
        }
    },

    logUsageEvent: (tenantId, action, pixels = 0, renderMs = 0, statusCode = 200, cacheHit = false) => {
        if (!db) return;
        try {
            const stmt = db.prepare(`
                INSERT INTO usage_events (tenant_id, action, pixels, render_ms, status_code, cache_hit)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            stmt.run(tenantId, action, pixels, renderMs, statusCode, cacheHit ? 1 : 0);
        } catch (e) {
            console.error('DB Error logging usage event:', e);
        }
    }
};

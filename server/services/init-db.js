const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '../data/chartsnap_v2.db');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, '../data'))) {
    fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // Better concurrency

console.log('Initializing ChartSnap V2 Database (SQLite)...');

// 1. Tenants Table
db.exec(`
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'BASIC',
    status TEXT NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// 2. API Keys Table (Hashed only, linked to Tenant)
db.exec(`
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    revoked_at DATETIME,
    last_used_at DATETIME,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
`);

// 3. Render Jobs Table (Async Queue State)
db.exec(`
CREATE TABLE IF NOT EXISTS render_jobs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    engine TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    finished_at DATETIME,
    error_code TEXT,
    spec_json TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON render_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_req_hash ON render_jobs(request_hash);
`);

// 4. Render Artifacts Table (Storage metadata)
db.exec(`
CREATE TABLE IF NOT EXISTS render_artifacts (
    job_id TEXT PRIMARY KEY,
    storage_key TEXT NOT NULL,
    bytes INTEGER,
    etag TEXT,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    expires_at DATETIME,
    FOREIGN KEY (job_id) REFERENCES render_jobs(id) ON DELETE CASCADE
);
`);

// 5. Usage Events (Metering)
db.exec(`
CREATE TABLE IF NOT EXISTS usage_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    action TEXT NOT NULL,
    pixels INTEGER DEFAULT 0,
    render_ms INTEGER,
    cache_hit BOOLEAN DEFAULT 0,
    status_code INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
`);

// 6. Rate Limiting Buckets (Replacing Redis for local dev)
db.exec(`
CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0,
    reset_at INTEGER NOT NULL
);
`);

console.log('Database tables created successfully.');

// Provide a seed script function to copy existing keys
function seedDatabase() {
    const keysPath = '/Users/mrchartist/.gemini/antigravity/scratch/chartsnap/server/data/keys.json';
    if (!fs.existsSync(keysPath)) {
        console.log('No keys.json found to seed from.');
        return;
    }

    const legacyData = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
    const keys = Object.entries(legacyData);

    console.log(`Migrating ${keys.length} legacy keys...`);

    const insertTenant = db.prepare('INSERT OR IGNORE INTO tenants (id, name, plan) VALUES (?, ?, ?)');
    const insertKey = db.prepare('INSERT OR IGNORE INTO api_keys (id, tenant_id, key_hash) VALUES (?, ?, ?)');

    db.transaction(() => {
        for (const [keyString, k] of keys) {
            const tenantId = `tenant_${keyString.substring(0, 8)}`;

            // PBKDF2 Hash simulation for DB (SHA256 for rapid lookup)
            const keyHash = crypto.createHash('sha256').update(keyString).digest('hex');

            insertTenant.run(tenantId, k.email || `legacy_${k.tier}`, k.tier);
            insertKey.run(`key_${keyString.substring(0, 8)}`, tenantId, keyHash);
        }
    })();

    console.log('Seed exacted successfully.');
}

seedDatabase();
console.log('Database initialization complete.');

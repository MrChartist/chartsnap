const dbService = require('./services/db');
const screenshotService = require('./services/screenshot');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.join(__dirname, '../storage');
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

async function processNextJob() {
    const db = dbService.getDb();
    if (!db) {
        console.error('[Worker] DB offline.');
        return false;
    }

    let job;
    try {
        db.transaction(() => {
            job = db.prepare(`SELECT * FROM render_jobs WHERE status = 'queued' ORDER BY priority DESC, created_at ASC LIMIT 1`).get();
            if (job) {
                db.prepare(`UPDATE render_jobs SET status = 'processing', started_at = CURRENT_TIMESTAMP WHERE id = ?`).run(job.id);
            }
        })();
    } catch (e) {
        console.error('[Worker] Queue check error:', e);
        return false;
    }

    if (!job) return false;

    console.log(`[Worker] Started job: ${job.id} (tenant: ${job.tenant_id})`);

    const startTime = Date.now();

    try {
        const spec = JSON.parse(job.spec_json);
        let result;

        // V2 Engine mapping & format adapter
        if (job.engine === 'native' || job.engine === 'lightweight_charts') {
            // Reusing our existing robust Canvas engine (v2 POST compatible)
            // Flatten the strictly nested PRD parameters into exactly what generateChart expects
            const mappedSpec = {
                symbol: spec.data?.symbol || 'BINANCE:BTCUSDT',
                interval: spec.data?.interval || '1D',
                width: spec.output?.width || 800,
                height: spec.output?.height || 600,
                theme: spec.scene?.theme || 'dark',
                studies: spec.studies || [],
                drawings: spec.drawings || []
            };
            const buffer = await screenshotService.generateChart(mappedSpec);
            result = { buffer, ext: spec.output?.format === 'jpeg' ? 'jpg' : 'png' };
        } else if (job.engine === 'tradingview_layout') {
            const mappedSpec = {
                layout: spec.data?.layout,
                symbol: spec.data?.symbol,
                interval: spec.data?.interval,
                width: spec.output?.width,
                height: spec.output?.height
            };
            result = await screenshotService.generateLayoutChart(mappedSpec);
        } else {
            throw new Error(`Unsupported engine: ${job.engine}. Available: native, lightweight_charts, tradingview_layout`);
        }

        const { buffer, ext } = result;
        const storageKey = `${job.id}.${ext}`;
        const sizeByte = buffer.length;
        const etag = crypto.createHash('md5').update(buffer).digest('hex');
        const mimeType = ext === 'jpg' ? 'image/jpeg' : 'image/png';

        fs.writeFileSync(path.join(STORAGE_DIR, storageKey), buffer);

        db.transaction(() => {
            db.prepare(`UPDATE render_jobs SET status = 'succeeded', finished_at = CURRENT_TIMESTAMP WHERE id = ?`).run(job.id);
            db.prepare(`
                INSERT INTO render_artifacts (job_id, storage_key, bytes, etag, mime_type, width, height, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+30 days'))
            `).run(job.id, storageKey, sizeByte, etag, mimeType, spec.output ? spec.output.width : spec.width || 800, spec.output ? spec.output.height : spec.height || 600);
        })();

        const duration = Date.now() - startTime;
        console.log(`[Worker] Succeeded: ${job.id} -> ${storageKey} (${duration}ms)`);

    } catch (e) {
        console.error(`[Worker] Failed: ${job.id} - ${e.message}`);
        db.prepare(`UPDATE render_jobs SET status = 'failed', error_code = ?, finished_at = CURRENT_TIMESTAMP WHERE id = ?`).run(e.message, job.id);
    }

    return true; // We processed a job, so tell the loop to run again immediately
}

async function loop() {
    try {
        const processed = await processNextJob();
        setTimeout(loop, processed ? 100 : 3000); // 100ms if busy, 3s if idle
    } catch (e) {
        console.error('[Worker] Loop error:', e);
        setTimeout(loop, 5000);
    }
}

// Ensure DB connects cleanly
setTimeout(() => {
    console.log('-------------------------------------------');
    console.log('[Worker] Render Queue Consumer started');
    console.log('-------------------------------------------');
    loop();
}, 1000);

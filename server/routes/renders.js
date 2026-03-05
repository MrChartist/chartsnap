const express = require('express');
const crypto = require('crypto');
const dbService = require('../services/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Apply auth mechanism to all job routes to populate req.tenant
router.use(authMiddleware);

function requireAuth(req, res, next) {
    if (!req.tenant) {
        return res.status(401).json({
            type: "https://chartsnap.com/problems/unauthorized",
            title: "Unauthorized",
            status: 401,
            detail: "Missing valid authentication. Authorization: Bearer required."
        });
    }
    next();
}

function canonicalJson(obj) {
    const keys = Object.keys(obj).sort();
    const sorted = {};
    for (const k of keys) sorted[k] = obj[k];
    return JSON.stringify(sorted);
}

// [V2 POST /v1/renders] - Create an Async Render Job
router.post('/', requireAuth, (req, res) => {
    const tenantId = req.tenant.id;
    const idempotencyKey = req.header('idempotency-key') || null;

    if (!req.body || !req.body.engine || !req.body.output || !req.body.data) {
        return res.status(422).json({
            type: "https://chartsnap.com/problems/invalid-request",
            title: "Invalid Request",
            status: 422,
            detail: "Missing required V2 spec fields: engine, output, and data."
        });
    }

    const canonical = canonicalJson(req.body);
    const requestHash = crypto.createHash('sha256').update(`${tenantId}:${canonical}`).digest('hex');
    const db = dbService.getDb();

    if (!db) return res.status(500).json({ error: "Database offline" });

    // 1. Dedupe check: has this same canonical request been rendered recently?
    // This provides massive scale multiplication by preventing redundant headless browser spawns
    const cachedJob = db.prepare(`
        SELECT r.id, a.storage_key, a.expires_at 
        FROM render_jobs r 
        LEFT JOIN render_artifacts a ON r.id = a.job_id
        WHERE r.tenant_id = ? AND r.request_hash = ? AND r.status = 'succeeded'
        ORDER BY r.created_at DESC LIMIT 1
    `).get(tenantId, requestHash);

    if (cachedJob) {
        // Cache hit! Return immediately, 0 compute spent.
        dbService.logUsageEvent(tenantId, 'render_cached', 0, 0, 200, true);
        return res.status(200).json({
            job_id: cachedJob.id,
            status: 'succeeded',
            artifacts: {
                cdn_url: `/v1/jobs/${cachedJob.id}/result`,
                expires_at: cachedJob.expires_at
            }
        });
    }

    // 2. Generate new Job ID
    const jobId = 'job_' + crypto.randomBytes(12).toString('hex');

    // 3. Save to DB
    const stmt = db.prepare(`
        INSERT INTO render_jobs (id, tenant_id, request_hash, engine, spec_json)
        VALUES (?, ?, ?, ?, ?)
    `);

    try {
        stmt.run(jobId, tenantId, requestHash, req.body.engine, JSON.stringify(req.body));
        dbService.logUsageEvent(tenantId, 'render_queued', 0, 0, 202, false);
    } catch (e) {
        console.error("Queue insert error:", e);
        return res.status(500).json({ status: 500, title: "Database Error" });
    }

    // 202 Accepted instructs client to poll the status endpoint instead of blocking Node's HTTP thread
    return res.status(202).json({
        job_id: jobId,
        status: 'queued',
        links: {
            self: `/v1/jobs/${jobId}`,
            result: `/v1/jobs/${jobId}/result`
        }
    });
});

// [V2 GET /v1/jobs/:id] - Fetch job completion status
router.get('/:id', requireAuth, (req, res) => {
    const jobId = req.params.id;
    const tenantId = req.tenant.id;
    const db = dbService.getDb();

    if (!db) return res.status(500).json({ error: "DB Offline" });

    const job = db.prepare('SELECT * FROM render_jobs WHERE id = ? AND tenant_id = ?').get(jobId, tenantId);

    if (!job) {
        return res.status(404).json({
            type: "https://chartsnap.com/problems/not-found",
            title: "Job Not Found",
            status: 404,
            detail: `Job ${jobId} does not exist or you lack permission.`
        });
    }

    const response = {
        job_id: job.id,
        status: job.status,
        timing: {
            created_at: job.created_at,
            started_at: job.started_at,
            finished_at: job.finished_at
        }
    };

    if (job.status === 'succeeded') {
        const artifact = db.prepare('SELECT * FROM render_artifacts WHERE job_id = ?').get(job.id);
        if (artifact) {
            response.output = {
                format: artifact.mime_type.split('/')[1],
                width: artifact.width,
                height: artifact.height,
                bytes: artifact.bytes
            };
            response.artifacts = {
                cdn_url: `/v1/jobs/${job.id}/result`,
                expires_at: artifact.expires_at
            };
        }
    } else if (job.status === 'failed') {
        response.error_code = job.error_code;
    }

    res.json(response);
});

// [V2 GET /v1/jobs/:id/result]
router.get('/:id/result', requireAuth, (req, res) => {
    const jobId = req.params.id;
    const tenantId = req.tenant.id;
    const db = dbService.getDb();

    const artifact = db.prepare(`
        SELECT a.storage_key, j.status 
        FROM render_jobs j
        JOIN render_artifacts a ON j.id = a.job_id
        WHERE j.id = ? AND j.tenant_id = ?
    `).get(jobId, tenantId);

    if (!artifact) {
        return res.status(404).json({
            type: "https://chartsnap.com/problems/not-ready",
            title: "Result Not Ready",
            status: 404,
            detail: "The job has not completed or the artifact does not exist."
        });
    }

    // R2 / S3 simulation: redirect user directly to CDN edge cache
    res.redirect(302, `/storage/${artifact.storage_key}`);
});

module.exports = router;

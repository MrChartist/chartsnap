const express = require('express');
const crypto = require('crypto');
const dbService = require('../services/db');
const router = express.Router();

// POST /v1/renders — Queue an async render job
router.post('/', (req, res) => {
    if (!req.body || !req.body.engine || !req.body.output || !req.body.data) {
        return res.status(422).json({
            error: true,
            message: 'Missing required fields: engine, output, data'
        });
    }

    const jobId = 'job_' + crypto.randomBytes(12).toString('hex');
    const tenantId = req.tenant.id;
    console.log(`[Renders] Attempting to queue job ${jobId} for tenant: "${tenantId}"`);
    const canonical = JSON.stringify(req.body);
    const requestHash = crypto.createHash('sha256').update(canonical).digest('hex');
    const db = dbService.getDb();

    if (!db) return res.status(500).json({ error: 'Database offline' });

    try {
        db.prepare(
            'INSERT INTO render_jobs (id, tenant_id, request_hash, engine, spec_json) VALUES (?, ?, ?, ?, ?)'
        ).run(jobId, tenantId, requestHash, req.body.engine, canonical);
    } catch (e) {
        console.error('Queue insert error:', e.message);
        return res.status(500).json({ error: 'Database error', message: e.message });
    }

    return res.status(202).json({
        job_id: jobId,
        status: 'queued',
        links: {
            self: `/v1/jobs/${jobId}`,
            result: `/v1/jobs/${jobId}/result`
        }
    });
});

// GET /v1/jobs/:id — Poll job status
router.get('/:id', (req, res) => {
    const jobId = req.params.id;
    if (jobId.includes('/')) return; // Let Express handle /:id/result
    const db = dbService.getDb();
    if (!db) return res.status(500).json({ error: 'DB Offline' });

    const job = db.prepare('SELECT * FROM render_jobs WHERE id = ?').get(jobId);
    if (!job) {
        return res.status(404).json({ error: true, message: `Job ${jobId} not found` });
    }

    const response = { job_id: job.id, status: job.status };

    if (job.status === 'succeeded') {
        const artifact = db.prepare('SELECT * FROM render_artifacts WHERE job_id = ?').get(job.id);
        if (artifact) {
            response.artifacts = {
                cdn_url: `/v1/jobs/${job.id}/result`,
                expires_at: artifact.expires_at
            };
        }
    } else if (job.status === 'failed') {
        response.error = job.error_code;
    }

    res.json(response);
});

// GET /v1/jobs/:id/result — Download the rendered image
router.get('/:id/result', (req, res) => {
    const jobId = req.params.id;
    const db = dbService.getDb();
    if (!db) return res.status(500).json({ error: 'DB Offline' });

    const artifact = db.prepare(
        'SELECT a.storage_key FROM render_jobs j JOIN render_artifacts a ON j.id = a.job_id WHERE j.id = ?'
    ).get(jobId);

    if (!artifact) {
        return res.status(404).json({ error: true, message: 'Result not ready yet' });
    }

    res.redirect(302, `/storage/${artifact.storage_key}`);
});

module.exports = router;

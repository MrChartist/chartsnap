const TIER_LIMITS = { BASIC: 50, PRO: 500, MEGA: 1000, ULTRA: 3000, ENTERPRISE: 99999 };

let keyVisible = false;
let currentKey = '';

async function init() {
    const key = localStorage.getItem('chartsnap_key');
    const email = localStorage.getItem('chartsnap_email');
    const tier = localStorage.getItem('chartsnap_tier') || 'BASIC';

    const nav = document.getElementById('nav-email');
    if (nav && email) nav.textContent = email;

    if (!key) {
        document.getElementById('no-key-state').style.display = 'block';
        return;
    }

    currentKey = key;
    document.getElementById('dash-content').style.display = 'block';
    document.getElementById('key-display').textContent = maskKey(key);

    // Update tier badges
    const tierBadge = document.getElementById('tier-badge');
    const sidebarTier = document.getElementById('sidebar-tier-badge');
    [tierBadge, sidebarTier].forEach(el => {
        if (el) { el.textContent = tier; el.className = `tier-badge tier-${tier}`; }
    });

    // Update quick start snippets with real key
    ['qs-mini', 'qs-adv'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = el.textContent.replace('YOUR_KEY', key);
    });

    await refreshKeyInfo();
}

async function refreshKeyInfo() {
    const key = currentKey || localStorage.getItem('chartsnap_key');
    if (!key) return;
    try {
        const res = await fetch('/api/key-info', { headers: { 'x-api-key': key } });
        const data = await res.json();
        if (data.success) {
            const used = data.usedToday || 0;
            const limit = TIER_LIMITS[data.tier] || 50;
            const remaining = Math.max(0, limit - used);
            const pct = Math.min(100, (used / limit) * 100);

            document.getElementById('stat-used').textContent = used;
            document.getElementById('stat-limit').textContent = limit;
            document.getElementById('stat-remaining').textContent = remaining;
            document.getElementById('usage-text').textContent = `${used} / ${limit}`;
            document.getElementById('usage-fill').style.width = pct + '%';

            // Color bar based on usage
            const fill = document.getElementById('usage-fill');
            if (pct > 90) fill.style.background = 'linear-gradient(90deg,#ff6b6b,#ff4444)';
            else if (pct > 70) fill.style.background = 'linear-gradient(90deg,#ffa657,#ff7b35)';
            else fill.style.background = 'var(--gradient-main)';
        }
    } catch { }
}

function maskKey(key) {
    if (!key) return '';
    return key.substring(0, 8) + '••••••••••••••••' + key.slice(-4);
}

function toggleKeyVisibility() {
    const el = document.getElementById('key-display');
    keyVisible = !keyVisible;
    el.textContent = keyVisible ? currentKey : maskKey(currentKey);
    const btn = document.getElementById('eye-btn');
    if (btn) btn.textContent = keyVisible ? '🙈' : '👁';
}

function copyKey() {
    if (!currentKey) return;
    navigator.clipboard.writeText(currentKey).then(() => showToast('API key copied!')).catch(() => { });
}

function copySnippet(id) {
    const el = document.getElementById(id);
    if (!el) return;
    navigator.clipboard.writeText(el.textContent).then(() => showToast('Copied!')).catch(() => { });
}

function openRegisterModal() { document.getElementById('register-modal').classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

async function registerKey() {
    const email = document.getElementById('reg-email').value.trim();
    const tier = document.getElementById('reg-tier').value;
    if (!email || !email.includes('@')) { showToast('Valid email required', 'error'); return; }
    try {
        const res = await fetch('/api/register', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, tier })
        });
        const data = await res.json();
        if (data.apiKey) {
            document.getElementById('reg-key-display').textContent = data.apiKey;
            document.getElementById('reg-result').classList.add('show');
            localStorage.setItem('chartsnap_key', data.apiKey);
            localStorage.setItem('chartsnap_email', data.email);
            localStorage.setItem('chartsnap_tier', data.tier);
            currentKey = data.apiKey;
            showToast('🎉 Key generated!');
            setTimeout(() => { closeModal('register-modal'); location.reload(); }, 2000);
        } else { showToast(data.message || 'Error', 'error'); }
    } catch { showToast('Server error', 'error'); }
}

function copyNewKey() {
    const k = document.getElementById('reg-key-display').textContent;
    navigator.clipboard.writeText(k).then(() => showToast('Copied!')).catch(() => { });
}

function logout() {
    localStorage.removeItem('chartsnap_key');
    localStorage.removeItem('chartsnap_email');
    localStorage.removeItem('chartsnap_tier');
    window.location.href = '/';
}

let toastTimeout;
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.color = type === 'error' ? '#ff6b6b' : 'var(--accent-green)';
    t.style.borderColor = type === 'error' ? 'rgba(255,107,107,0.3)' : 'rgba(34,197,94,0.3)';
    t.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => t.classList.remove('show'), 3000);
}

document.addEventListener('DOMContentLoaded', init);

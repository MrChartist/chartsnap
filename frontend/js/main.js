// ─── Hero Chart Animation ─────────────────────────────────────────────────────
function renderHeroChart() {
    const container = document.getElementById('heroChart');
    if (!container) return;
    const colors = ['#7b61ff', '#ff61b3', '#61b3ff', '#7b61ff', '#ff61b3', '#22c55e', '#7b61ff', '#61b3ff', '#ff61b3', '#7b61ff', '#22c55e', '#61b3ff', '#ff61b3', '#7b61ff', '#61b3ff', '#22c55e', '#7b61ff', '#ff61b3', '#61b3ff', '#7b61ff'];
    const heights = [40, 55, 70, 50, 80, 60, 90, 75, 65, 85, 55, 95, 70, 80, 60, 75, 50, 88, 65, 72];
    container.innerHTML = heights.map((h, i) => `<div class="chart-bar" style="height:${h}%;background:${colors[i]};opacity:${0.5 + (h / 100) * 0.5}"></div>`).join('');
    // Animate
    setInterval(() => {
        const bars = container.querySelectorAll('.chart-bar');
        bars.forEach(b => {
            const h = 30 + Math.random() * 65;
            b.style.height = h + '%';
        });
    }, 2000);
}

// ─── Fade-In Intersection Observer ───────────────────────────────────────────
function initFadeIn() {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));
}

// ─── Code Tabs ────────────────────────────────────────────────────────────────
function switchTab(lang, btn) {
    document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    ['curl', 'js', 'python'].forEach(l => {
        const el = document.getElementById(`code-${l}`);
        if (el) el.style.display = l === lang ? 'block' : 'none';
    });
}

function copyCode(lang) {
    const el = document.getElementById(`code-${lang}`);
    if (!el) return;
    const text = el.querySelector('pre').innerText;
    navigator.clipboard.writeText(text).then(() => showToast('Code copied!')).catch(() => { });
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────
function toggleFaq(item) {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
}

// ─── Register Modal ───────────────────────────────────────────────────────────
function openModal(id) {
    document.getElementById(id).classList.add('open');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('open');
    const result = document.getElementById('reg-result');
    if (result) result.classList.remove('show');
    const input = document.getElementById('reg-email');
    if (input) input.value = '';
}

async function registerKey() {
    const email = document.getElementById('reg-email').value.trim();
    const tier = document.getElementById('reg-tier').value;
    if (!email || !email.includes('@')) {
        showToast('Please enter a valid email address.', 'error');
        return;
    }
    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, tier })
        });
        const data = await res.json();
        if (data.apiKey) {
            document.getElementById('reg-key-display').textContent = data.apiKey;
            document.getElementById('reg-result').classList.add('show');
            localStorage.setItem('chartsnap_key', data.apiKey);
            localStorage.setItem('chartsnap_email', data.email);
            localStorage.setItem('chartsnap_tier', data.tier);
            showToast('🎉 API key generated!');
        } else {
            showToast(data.message || 'Error generating key.', 'error');
        }
    } catch (e) {
        showToast('Server error. Is ChartSnap running?', 'error');
    }
}

function copyNewKey() {
    const key = document.getElementById('reg-key-display').textContent;
    navigator.clipboard.writeText(key).then(() => showToast('Key copied!')).catch(() => { });
}

// ─── Toast ────────────────────────────────────────────────────────────────────
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

// ─── Navbar scroll effect ─────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.style.background = window.scrollY > 50 ? 'rgba(10,13,20,0.97)' : 'rgba(10,13,20,0.85)';
});

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    renderHeroChart();
    initFadeIn();
});

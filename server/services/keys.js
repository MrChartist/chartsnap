const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const KEYS_FILE = path.join(__dirname, '../data/keys.json');
const USAGE_FILE = path.join(__dirname, '../data/usage.json');

function loadKeys() {
    try { return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8')); } catch { return {}; }
}

function saveKeys(data) {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2));
}

function loadUsage() {
    try { return JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8')); } catch { return {}; }
}

function todayKey() {
    return new Date().toISOString().split('T')[0];
}

function generateKey(email, tier = 'BASIC') {
    const keys = loadKeys();
    // Check if email already has a key
    const existing = Object.entries(keys).find(([, v]) => v.email === email);
    if (existing) return { apiKey: existing[0], ...existing[1] };

    const newKey = `cs-${uuidv4()}`;
    keys[newKey] = { email, tier, createdAt: new Date().toISOString(), active: true };
    saveKeys(keys);
    return { apiKey: newKey, email, tier };
}

function getKeyInfo(apiKey) {
    const keys = loadKeys();
    const usage = loadUsage();
    const keyData = keys[apiKey];
    if (!keyData) return null;

    const day = todayKey();
    const dayUsage = (usage[apiKey] && usage[apiKey][day]) || { count: 0 };

    return { ...keyData, usedToday: dayUsage.count };
}

module.exports = { generateKey, getKeyInfo };

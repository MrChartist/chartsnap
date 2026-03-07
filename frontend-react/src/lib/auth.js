// Token storage helpers
const TOKEN_KEY = 'pt_session';

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn() {
    const token = getToken();
    if (!token) return false;
    try {
        const payload = parseToken(token);
        if (!payload || !payload.exp) return false;
        return payload.exp > Math.floor(Date.now() / 1000);
    } catch {
        return false;
    }
}

export function parseToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
        return null;
    }
}

export function getUser() {
    const token = getToken();
    if (!token) return null;
    return parseToken(token);
}

// Authenticated fetch — automatically adds Authorization header
export function authFetch(url, options = {}) {
    const token = getToken();
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });
}

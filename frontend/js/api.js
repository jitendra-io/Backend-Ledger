/* =========================================================
   API.JS — Ledger Banking Frontend API Layer
   Base URL & helpers for all backend API calls
   ========================================================= */

const API_BASE = 'http://localhost:3000/api';

// ── Storage helpers ──────────────────────────────────────
const Store = {
    set(key, val) { localStorage.setItem('ledger_' + key, JSON.stringify(val)); },
    get(key) {
        try { return JSON.parse(localStorage.getItem('ledger_' + key)); }
        catch { return null; }
    },
    remove(key) { localStorage.removeItem('ledger_' + key); },
    clear() {
        ['token','user','account'].forEach(k => Store.remove(k));
    }
};

// ── Core fetch wrapper ────────────────────────────────────
async function apiFetch(path, options = {}) {
    const token = Store.get('token');
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(API_BASE + path, {
        ...options,
        headers,
        credentials: 'include'
    });

    let data;
    try { data = await res.json(); } catch { data = {}; }

    if (!res.ok) {
        throw new Error(data.message || `Request failed (${res.status})`);
    }
    return data;
}

// ── Auth endpoints ─────────────────────────────────────────
const AuthAPI = {
    register: (name, email, password) =>
        apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        }),

    login: (email, password) =>
        apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        }),
};

// ── Account endpoints ──────────────────────────────────────
const AccountAPI = {
    create: (currency = 'INR') =>
        apiFetch('/accounts', {
            method: 'POST',
            body: JSON.stringify({ currency })
        }),
};

// ── Transaction endpoints ──────────────────────────────────
const TransactionAPI = {
    create: (fromAccount, toAccount, amount, idempotencyKey) =>
        apiFetch('/transactions', {
            method: 'POST',
            body: JSON.stringify({ fromAccount, toAccount, amount: Number(amount), idempotencyKey })
        }),
};

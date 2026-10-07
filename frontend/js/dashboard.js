/* =========================================================
   DASHBOARD.JS — Ledger Banking Dashboard Logic
   ========================================================= */

// ── Guard: require auth ──────────────────────────────────
const _user    = Store.get('user');
const _token   = Store.get('token');
if (!_user || !_token) {
    window.location.href = 'index.html';
}

// ── App State ─────────────────────────────────────────────
const AppState = {
    user:         _user,
    token:        _token,
    account:      Store.get('account') || null,
    transactions: [],    // ledger-style tx list built from local records
    txFilter:     'all',
    txSearch:     '',
};

// ── Utilities ──────────────────────────────────────────────
function fmt(amount, currency = 'INR') {
    const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
    return sym + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function fmtDateShort(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

function truncate(str, n = 12) {
    if (!str) return '—';
    return str.length > n ? str.slice(0, n) + '…' : str;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

// ── Toast Notifications ────────────────────────────────────
function toast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<div class="toast-dot"></div><div class="toast-msg">${msg}</div>`;
    container.appendChild(el);
    setTimeout(() => {
        el.classList.add('toast-out');
        setTimeout(() => el.remove(), 300);
    }, 3800);
}

// ── Loading state ─────────────────────────────────────────
function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const text    = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-spinner');
    btn.disabled = loading;
    if (text)    text.style.opacity = loading ? '0.4' : '1';
    if (spinner) spinner.classList.toggle('hidden', !loading);
}

// ── Alert helpers ──────────────────────────────────────────
function showMsg(id, msg, type = 'error') {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.className = type === 'error' ? 'form-error' : 'form-success';
}
function hideMsg(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'form-error hidden';
    el.textContent = '';
}

// ── Sidebar navigation ─────────────────────────────────────
function showSection(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById('section-' + name).classList.add('active');
    const navEl = document.getElementById('nav-' + name);
    if (navEl) navEl.classList.add('active');

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');

    // Lazy-load section data
    if (name === 'history') renderHistory();
    if (name === 'account') renderAccountSection();
    if (name === 'transfer') populateTransferAccounts();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ── Populate user UI ───────────────────────────────────────
function populateUser() {
    const u = AppState.user;
    const initials = u.name ? u.name.charAt(0).toUpperCase() : '?';

    document.getElementById('sidebar-username').textContent = u.name || '—';
    document.getElementById('sidebar-email').textContent    = u.email || '';
    document.getElementById('user-avatar').textContent      = initials;
    document.getElementById('topbar-avatar').textContent    = initials;

    // Profile section
    const pa = document.getElementById('profile-avatar-large');
    if (pa) { pa.textContent = initials; }
    const pn = document.getElementById('profile-name');   if (pn) pn.textContent = u.name || '—';
    const pe = document.getElementById('profile-email');  if (pe) pe.textContent = u.email || '—';
    const pi = document.getElementById('profile-id');     if (pi) pi.textContent = u._id || '—';
}

// ── Render Home Section ────────────────────────────────────
function renderHome() {
    const acc = AppState.account;
    const noAccBanner = document.getElementById('no-account-banner');
    const heroCard    = document.getElementById('home-recent-card');

    if (!acc) {
        // No account
        document.getElementById('hero-balance').textContent   = '0.00';
        document.getElementById('hero-account-id').textContent = '';
        document.getElementById('hero-badge').textContent     = 'NO ACCOUNT';
        document.getElementById('hero-badge').className       = 'balance-badge';
        noAccBanner.classList.remove('hidden');

        document.getElementById('home-tx-list').innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p>Create an account to see transactions</p>
            </div>`;
        document.getElementById('stat-credit').textContent = '₹0.00';
        document.getElementById('stat-debit').textContent  = '₹0.00';
        document.getElementById('stat-count').textContent  = '0';
        return;
    }

    noAccBanner.classList.add('hidden');

    // Balance from local ledger
    const { balance, totalCredit, totalDebit } = computeBalance();
    document.getElementById('hero-balance').textContent    = Number(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    document.getElementById('hero-account-id').textContent = 'ID: ' + acc._id;
    document.getElementById('hero-badge').textContent      = acc.status || 'ACTIVE';
    document.getElementById('hero-badge').className        = 'balance-badge positive';

    // Stats
    document.getElementById('stat-credit').textContent = fmt(totalCredit, acc.currency);
    document.getElementById('stat-debit').textContent  = fmt(totalDebit,  acc.currency);
    document.getElementById('stat-count').textContent  = AppState.transactions.length;

    // Recent transactions (last 5)
    const recent = [...AppState.transactions].slice(-5).reverse();
    renderTxList('home-tx-list', recent);
}

// ── Compute balance from local transaction history ─────────
function computeBalance() {
    const acc = AppState.account;
    if (!acc) return { balance: 0, totalCredit: 0, totalDebit: 0 };

    let totalCredit = 0, totalDebit = 0;
    AppState.transactions.forEach(tx => {
        if (tx.type === 'CREDIT') totalCredit += tx.amount;
        else                      totalDebit  += tx.amount;
    });
    return { balance: totalCredit - totalDebit, totalCredit, totalDebit };
}

// ── Render a transaction list ──────────────────────────────
function renderTxList(containerId, txList) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (!txList || txList.length === 0) {
        el.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p>No transactions yet</p>
            </div>`;
        return;
    }

    const acc = AppState.account;
    const currency = acc ? acc.currency : 'INR';

    el.innerHTML = txList.map(tx => {
        const isCredit = tx.type === 'CREDIT';
        const icon = isCredit
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="3" x2="12" y2="21"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`;

        const amountStr = (isCredit ? '+' : '−') + fmt(tx.amount, currency);
        const counterpart = isCredit
            ? 'From: ' + truncate(tx.fromAccount, 16)
            : 'To: '   + truncate(tx.toAccount,   16);

        const status = (tx.status || 'COMPLETED').toLowerCase();

        return `
        <div class="tx-item" title="Transaction ID: ${tx._id || '—'}">
            <div class="tx-icon-wrap ${isCredit ? 'credit' : 'debit'}">${icon}</div>
            <div class="tx-details">
                <div class="tx-type">${isCredit ? 'Money Received' : 'Money Sent'}</div>
                <div class="tx-meta">${counterpart} &nbsp;·&nbsp; ${fmtDate(tx.createdAt)}</div>
            </div>
            <div class="tx-amount-col">
                <div class="tx-amount ${isCredit ? 'credit' : 'debit'}">${amountStr}</div>
                <div class="tx-status ${status}">${(tx.status || 'COMPLETED').toUpperCase()}</div>
            </div>
        </div>`;
    }).join('');
}

// ── Render History Section ─────────────────────────────────
function renderHistory() {
    const emptyEl = document.getElementById('history-empty');
    let list = [...AppState.transactions].reverse();

    // Filter type
    if (AppState.txFilter !== 'all') {
        list = list.filter(tx => tx.type.toLowerCase() === AppState.txFilter);
    }
    // Filter search
    if (AppState.txSearch) {
        const q = AppState.txSearch.toLowerCase();
        list = list.filter(tx =>
            (tx._id || '').toLowerCase().includes(q) ||
            (tx.fromAccount || '').toLowerCase().includes(q) ||
            (tx.toAccount   || '').toLowerCase().includes(q) ||
            String(tx.amount).includes(q)
        );
    }

    renderTxList('history-tx-list', list);
    if (emptyEl) emptyEl.classList.toggle('hidden', list.length > 0);
}

function filterTx(type, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    AppState.txFilter = type;
    renderHistory();
}

function filterSearch(q) {
    AppState.txSearch = q;
    renderHistory();
}

// ── Render Account Section ─────────────────────────────────
function renderAccountSection() {
    const acc = AppState.account;
    const noMsg   = document.getElementById('no-account-msg');
    const accGrid = document.getElementById('account-info-grid');

    if (!acc) {
        if (noMsg) noMsg.classList.remove('hidden');
        if (accGrid) {
            accGrid.querySelectorAll('.info-val').forEach(el => el.textContent = '—');
        }
        document.getElementById('acc-status-badge').textContent = 'NO ACCOUNT';
        document.getElementById('acc-status-badge').className   = 'status-badge';
        return;
    }

    if (noMsg) noMsg.classList.add('hidden');

    const { balance } = computeBalance();
    document.getElementById('acc-id-val').textContent       = acc._id;
    document.getElementById('acc-currency-val').textContent = acc.currency || 'INR';
    document.getElementById('acc-status-val').textContent   = acc.status || 'ACTIVE';
    document.getElementById('acc-created-val').textContent  = fmtDateShort(acc.createdAt);
    document.getElementById('acc-balance-val').textContent  = fmt(balance, acc.currency);

    const badge = document.getElementById('acc-status-badge');
    const status = (acc.status || 'ACTIVE').toLowerCase();
    badge.textContent  = acc.status || 'ACTIVE';
    badge.className    = `status-badge ${status}`;
}

// ── Populate Transfer Account Dropdown ─────────────────────
function populateTransferAccounts() {
    const sel = document.getElementById('tf-from');
    if (!sel) return;
    sel.innerHTML = '<option value="">Select your account…</option>';

    const acc = AppState.account;
    if (!acc) return;

    const opt = document.createElement('option');
    opt.value = acc._id;
    opt.textContent = `${acc._id.slice(-8)} · ${acc.currency} · ${acc.status}`;
    sel.appendChild(opt);
    sel.value = acc._id;

    // My account ID display
    const myIdEl = document.getElementById('my-account-id-display');
    if (myIdEl) myIdEl.textContent = acc._id;

    // Auto-generate idempotency key
    generateIdempotencyKey();
}

function generateIdempotencyKey() {
    const el = document.getElementById('tf-idempotency');
    if (el) el.value = generateUUID();
}

function copyAccountId() {
    const acc = AppState.account;
    if (!acc) return;
    navigator.clipboard.writeText(acc._id).then(() => toast('Account ID copied!', 'success'));
}

// ── Handle Create Account ──────────────────────────────────
async function handleCreateAccount(e) {
    e.preventDefault();
    hideMsg('create-acc-error');
    hideMsg('create-acc-success');

    const currency = document.getElementById('ca-currency').value;
    setLoading('create-acc-btn', true);

    try {
        const data = await AccountAPI.create(currency);
        const acc = data.account || data;
        AppState.account = acc;
        Store.set('account', acc);

        showMsg('create-acc-success', `Account created! ID: ${acc._id}`, 'success');
        toast('Account created successfully!', 'success');
        renderHome();
        renderAccountSection();
    } catch (err) {
        showMsg('create-acc-error', err.message, 'error');
        toast(err.message, 'error');
    } finally {
        setLoading('create-acc-btn', false);
    }
}

// ── Handle Transfer ────────────────────────────────────────
async function handleTransfer(e) {
    e.preventDefault();
    hideMsg('transfer-error');
    hideMsg('transfer-success');

    const fromAccount    = document.getElementById('tf-from').value.trim();
    const toAccount      = document.getElementById('tf-to').value.trim();
    const amount         = document.getElementById('tf-amount').value;
    const idempotencyKey = document.getElementById('tf-idempotency').value.trim();

    if (!fromAccount) { showMsg('transfer-error', 'Select a source account.'); return; }
    if (!toAccount)   { showMsg('transfer-error', 'Enter recipient account ID.'); return; }
    if (!amount || Number(amount) <= 0) { showMsg('transfer-error', 'Enter a valid amount.'); return; }
    if (!idempotencyKey) { showMsg('transfer-error', 'Idempotency key is required.'); return; }

    if (fromAccount === toAccount) {
        showMsg('transfer-error', 'Source and destination accounts cannot be the same.');
        return;
    }

    setLoading('transfer-submit-btn', true);

    try {
        const data = await TransactionAPI.create(fromAccount, toAccount, amount, idempotencyKey);

        // Record DEBIT locally
        const tx = data.transaction || {};
        const localTx = {
            _id:            tx._id || generateUUID(),
            type:           'DEBIT',
            amount:         Number(amount),
            fromAccount,
            toAccount,
            status:         tx.status || 'COMPLETED',
            createdAt:      tx.createdAt || new Date().toISOString(),
            idempotencyKey,
        };
        AppState.transactions.push(localTx);
        saveTransactions();

        showMsg('transfer-success', `₹${amount} sent successfully!`, 'success');
        toast(`₹${amount} sent to ${truncate(toAccount, 12)}`, 'success');

        // Reset form
        document.getElementById('tf-amount').value = '';
        document.getElementById('tf-to').value = '';
        generateIdempotencyKey();

        renderHome();
    } catch (err) {
        showMsg('transfer-error', err.message);
        toast(err.message, 'error');
    } finally {
        setLoading('transfer-submit-btn', false);
    }
}

// ── Persist & Load Transactions ────────────────────────────
function saveTransactions() {
    const key = 'txs_' + (AppState.user._id || '');
    Store.set(key, AppState.transactions);
}

function loadTransactions() {
    const key = 'txs_' + (AppState.user._id || '');
    AppState.transactions = Store.get(key) || [];
}

// ── Handle Logout ──────────────────────────────────────────
function handleLogout() {
    Store.clear();
    window.location.href = 'index.html';
}

// ── Global Search ─────────────────────────────────────────
function handleSearch(val) {
    AppState.txSearch = val;
    if (val.length > 0) {
        showSection('history');
        filterSearch(val);
        document.getElementById('history-search').value = val;
    }
}

// ── Refresh Dashboard ──────────────────────────────────────
function refreshDashboard() {
    renderHome();
    toast('Dashboard refreshed', 'info');
}

// ── Init ──────────────────────────────────────────────────
function init() {
    populateUser();
    loadTransactions();
    renderHome();
    showSection('home');
}

init();

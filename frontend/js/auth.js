/* =========================================================
   AUTH.JS — Ledger Banking Login / Register Page Logic
   ========================================================= */

// ── Redirect if already logged in ───────────────────────
(function () {
    if (Store.get('token') && Store.get('user')) {
        window.location.href = 'dashboard.html';
    }
})();

// ── Tab switching ────────────────────────────────────────
function switchTab(tab) {
    const loginForm    = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');
    const loginTab     = document.getElementById('tab-login');
    const registerTab  = document.getElementById('tab-register');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        clearError('login-error');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
        clearError('register-error');
    }
}

// ── Toggle password visibility ───────────────────────────
function togglePass(inputId, btn) {
    const input = document.getElementById(inputId);
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    btn.style.color = isText ? '' : 'var(--accent)';
}

// ── Error helpers ────────────────────────────────────────
function showError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.classList.remove('hidden');
}
function clearError(id) {
    const el = document.getElementById(id);
    el.textContent = '';
    el.classList.add('hidden');
}

// ── Loading state ────────────────────────────────────────
function setLoading(btnId, loading) {
    const btn     = document.getElementById(btnId);
    const text    = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-spinner');
    btn.disabled = loading;
    if (loading) {
        text.style.opacity = '0.4';
        spinner.classList.remove('hidden');
    } else {
        text.style.opacity = '1';
        spinner.classList.add('hidden');
    }
}

// ── Handle Login ─────────────────────────────────────────
async function handleLogin(e) {
    e.preventDefault();
    clearError('login-error');
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    setLoading('login-submit-btn', true);
    try {
        const data = await AuthAPI.login(email, password);
        Store.set('token', data.token);
        Store.set('user', data.user);
        window.location.href = 'dashboard.html';
    } catch (err) {
        showError('login-error', err.message);
        setLoading('login-submit-btn', false);
    }
}

// ── Handle Register ───────────────────────────────────────
async function handleRegister(e) {
    e.preventDefault();
    clearError('register-error');
    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (password.length < 6) {
        showError('register-error', 'Password must be at least 6 characters.');
        return;
    }

    setLoading('register-submit-btn', true);
    try {
        const data = await AuthAPI.register(name, email, password);
        Store.set('token', data.token);
        Store.set('user', data.user);
        window.location.href = 'dashboard.html';
    } catch (err) {
        showError('register-error', err.message);
        setLoading('register-submit-btn', false);
    }
}

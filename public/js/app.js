// ── API CLIENT ──
const API = {
  baseUrl: '/api',
  token: null,

  setToken(t) {
    this.token = t;
    if (t) localStorage.setItem('ais_token', t);
    else localStorage.removeItem('ais_token');
  },

  loadToken() {
    this.token = localStorage.getItem('ais_token');
  },

  async request(method, path, body, isFormData = false) {
    const headers = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const opts = { method, headers };
    if (body) opts.body = isFormData ? body : JSON.stringify(body);

    const res = await fetch(`${this.baseUrl}${path}`, opts);
    const data = await res.json();

    if (res.status === 401) {
      App.logout();
      throw new Error('Session expired. Please log in again.');
    }

    return { ok: res.ok, status: res.status, data };
  },

  get: (path) => API.request('GET', path),
  post: (path, body) => API.request('POST', path, body),
  put: (path, body) => API.request('PUT', path, body),
  delete: (path) => API.request('DELETE', path),
  postForm: (path, formData) => API.request('POST', path, formData, true),
};

// ── TOAST ──
const Toast = {
  container: null,
  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  },
  show(message, type = 'info', duration = 3500) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
};

// ── MODAL HELPER ──
const Modal = {
  show(content, options = {}) {
    const existing = document.getElementById('global-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'global-modal';
    overlay.innerHTML = `
      <div class="modal ${options.large ? 'modal-lg' : ''}">
        <div class="modal-header">
          <span class="modal-title">${options.title || ''}</span>
          <button class="modal-close" onclick="Modal.close()">×</button>
        </div>
        <div class="modal-body">${content}</div>
        ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
      </div>`;

    overlay.addEventListener('click', (e) => { if (e.target === overlay) Modal.close(); });
    document.body.appendChild(overlay);
    return overlay;
  },
  close() {
    const m = document.getElementById('global-modal');
    if (m) m.remove();
  },
};

// ── CONFIRM DIALOG ──
function confirm(message, title = 'Confirm') {
  return new Promise((resolve) => {
    Modal.show(`<p>${message}</p>`, {
      title,
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close(); window._confirmResolve(false)">Cancel</button>
        <button class="btn btn-danger" onclick="Modal.close(); window._confirmResolve(true)">Confirm</button>`,
    });
    window._confirmResolve = resolve;
  });
}

// ── UTILITY FUNCTIONS ──
function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(n) {
  if (n === null || n === undefined) return '-';
  return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 0 });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / 86400000);
}

function expiryClass(dateStr) {
  const d = daysUntil(dateStr);
  if (d === null) return '';
  if (d <= 30) return 'expiry-critical';
  if (d <= 60) return 'expiry-warning';
  return 'expiry-ok';
}

function badge(value, prefix = '') {
  return `<span class="badge badge-${prefix}${value}">${value}</span>`;
}

function buildPagination(pagination, onPage) {
  if (!pagination || pagination.pages <= 1) return '';
  const { page, pages, total, limit } = pagination;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  let pageButtons = '';
  const range = 2;
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - range && i <= page + range)) {
      pageButtons += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="(${onPage})(${i})">${i}</button>`;
    } else if (i === page - range - 1 || i === page + range + 1) {
      pageButtons += `<span style="padding:5px 4px;color:var(--text-muted)">…</span>`;
    }
  }

  return `
    <div class="pagination">
      <span class="pagination-info">Showing ${start}–${end} of ${total}</span>
      <div class="pagination-buttons">
        <button class="page-btn" onclick="(${onPage})(${page - 1})" ${page <= 1 ? 'disabled' : ''}>‹ Prev</button>
        ${pageButtons}
        <button class="page-btn" onclick="(${onPage})(${page + 1})" ${page >= pages ? 'disabled' : ''}>Next ›</button>
      </div>
    </div>`;
}

// ── APP STATE & ROUTER ──
const App = {
  user: null,
  currentSection: 'dashboard',

  init() {
    Toast.init();
    API.loadToken();

    if (API.token) {
      this.verifyAndLoad();
    } else {
      this.showAuth();
    }

    document.getElementById('login-form').addEventListener('submit', this.handleLogin.bind(this));
  },

  async verifyAndLoad() {
    try {
      const { ok, data } = await API.get('/auth/me');
      if (ok) {
        this.user = data.user;
        this.showApp();
      } else {
        this.showAuth();
      }
    } catch {
      this.showAuth();
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    const errorEl = document.getElementById('login-error');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing in…';
    errorEl.style.display = 'none';

    try {
      const { ok, data } = await API.post('/auth/login', { email, password });
      if (ok) {
        API.setToken(data.token);
        this.user = data.user;
        this.showApp();
      } else {
        errorEl.textContent = data.message || 'Login failed';
        errorEl.style.display = 'flex';
      }
    } catch (err) {
      errorEl.textContent = 'Network error. Please try again.';
      errorEl.style.display = 'flex';
    }

    btn.disabled = false;
    btn.innerHTML = 'Sign In';
  },

  showAuth() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-screen').style.display = 'none';
  },

  showApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    this.renderUserInfo();
    this.renderNav();
    this.navigate('dashboard');
  },

  renderUserInfo() {
    const { username, role } = this.user;
    document.getElementById('user-avatar').textContent = username.charAt(0).toUpperCase();
    document.getElementById('user-name').textContent = username;
    document.getElementById('user-role').textContent = role;
  },

  renderNav() {
    const role = this.user.role;
    const items = [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
      { id: 'assets', icon: '📱', label: 'Assets' },
      { id: 'employees', icon: '👥', label: 'Employees' },
      { id: 'contracts', icon: '📄', label: 'Contracts' },
      { id: 'audit-logs', icon: '📋', label: 'Audit Logs', roles: ['superadmin', 'itadmin'] },
      { id: 'import', icon: '📥', label: 'Import', roles: ['superadmin', 'itadmin'] },
      { id: 'scanner', icon: '📷', label: 'Scanner' },
      { id: 'users', icon: '🔐', label: 'Users', roles: ['superadmin'] },
    ];

    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = items
      .filter(item => !item.roles || item.roles.includes(role))
      .map(item => `
        <div class="nav-item" data-section="${item.id}" onclick="App.navigate('${item.id}')">
          <span class="icon">${item.icon}</span>
          <span>${item.label}</span>
        </div>`).join('');
  },

  navigate(section) {
    this.currentSection = section;

    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.section === section);
    });

    const titles = {
      dashboard: 'Dashboard',
      assets: 'Assets',
      employees: 'Employees',
      contracts: 'Contracts',
      'audit-logs': 'Audit Logs',
      import: 'Import Data',
      scanner: 'Scanner',
      users: 'User Management',
    };

    document.getElementById('topbar-title').textContent = titles[section] || section;

    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading-overlay"><div class="spinner"></div><span>Loading…</span></div>';

    const loaders = {
      dashboard: () => Dashboard.load(),
      assets: () => Assets.load(),
      employees: () => Employees.load(),
      contracts: () => Contracts.load(),
      'audit-logs': () => AuditLogs.load(),
      import: () => Import.load(),
      scanner: () => Scanner.load(),
      users: () => Users.load(),
    };

    if (loaders[section]) loaders[section]();
  },

  logout() {
    API.setToken(null);
    this.user = null;
    Scanner.stop();
    this.showAuth();
  },
};

window.addEventListener('load', () => App.init());

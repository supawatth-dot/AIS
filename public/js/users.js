const Users = {
  async load() {
    this.render();
  },

  async render() {
    const { ok, data } = await API.get('/auth/users');
    if (!ok) {
      document.getElementById('content-area').innerHTML = `<div class="alert alert-error">Failed to load users.</div>`;
      return;
    }

    const rows = data.data.map(u => `
      <tr>
        <td><strong>${u.username}</strong></td>
        <td>${u.email}</td>
        <td>${badge(u.role)}</td>
        <td>
          <span class="badge ${u.isActive ? 'badge-active' : 'badge-retired'}">
            ${u.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>${formatDate(u.createdAt)}</td>
        <td class="table-actions">
          <button class="btn btn-sm btn-${u.isActive ? 'warning' : 'success'} btn-icon"
            title="${u.isActive ? 'Deactivate' : 'Activate'}"
            onclick="Users.toggle(${u.id}, '${u.username}')">
            ${u.isActive ? '🚫' : '✅'}
          </button>
          <button class="btn btn-sm btn-secondary btn-icon" title="Reset Password"
            onclick="Users.showResetPassword(${u.id}, '${u.username}')">
            🔑
          </button>
        </td>
      </tr>`).join('') || `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">🔐</div><h3>No users found</h3></div></td></tr>`;

    document.getElementById('content-area').innerHTML = `
      <div class="page-header">
        <h2>User Management</h2>
        <button class="btn btn-primary" onclick="Users.showAdd()">+ Add User</button>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="alert alert-info mb-3">
            Only Super Admins can manage users. Default credentials: <strong>admin@ais.local</strong> / <strong>Admin@123</strong>
          </div>
          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </div>`;
  },

  showAdd() {
    Modal.show(`
      <div class="form-group">
        <label class="form-label">Username *</label>
        <input class="form-control" id="f-username" placeholder="johndoe">
      </div>
      <div class="form-group">
        <label class="form-label">Email *</label>
        <input class="form-control" type="email" id="f-email" placeholder="john@company.com">
      </div>
      <div class="form-group">
        <label class="form-label">Password *</label>
        <input class="form-control" type="password" id="f-password" placeholder="Min 6 characters">
      </div>
      <div class="form-group">
        <label class="form-label">Role *</label>
        <select class="form-control" id="f-role">
          <option value="viewer">Viewer</option>
          <option value="itadmin">IT Admin</option>
          <option value="superadmin">Super Admin</option>
        </select>
      </div>`, {
      title: 'Add User',
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="Users.create()">Create User</button>`,
    });
  },

  async create() {
    const username = document.getElementById('f-username').value.trim();
    const email = document.getElementById('f-email').value.trim();
    const password = document.getElementById('f-password').value;
    const role = document.getElementById('f-role').value;

    if (!username || !email || !password) return Toast.show('All fields are required', 'error');

    const { ok, data } = await API.post('/auth/register', { username, email, password, role });
    if (ok) {
      Modal.close();
      Toast.show('User created successfully', 'success');
      this.render();
    } else {
      Toast.show(data.message || 'Failed to create user', 'error');
    }
  },

  async toggle(id, username) {
    const { ok, data } = await API.put(`/auth/users/${id}/toggle`, {});
    if (ok) {
      const state = data.user.isActive ? 'activated' : 'deactivated';
      Toast.show(`User "${username}" ${state}`, 'success');
      this.render();
    } else {
      Toast.show(data.message || 'Failed to toggle user', 'error');
    }
  },

  showResetPassword(id, username) {
    Modal.show(`
      <p class="mb-3">Reset password for <strong>${username}</strong>:</p>
      <div class="form-group">
        <label class="form-label">New Password *</label>
        <input class="form-control" type="password" id="f-new-password" placeholder="Min 6 characters">
      </div>`, {
      title: 'Reset Password',
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="Users.resetPassword(${id})">Reset Password</button>`,
    });
  },

  async resetPassword(id) {
    const password = document.getElementById('f-new-password').value;
    if (!password || password.length < 6) return Toast.show('Password must be at least 6 characters', 'error');

    const { ok, data } = await API.put(`/auth/users/${id}/reset-password`, { password });
    if (ok) {
      Modal.close();
      Toast.show('Password reset successfully', 'success');
    } else {
      Toast.show(data.message || 'Failed to reset password', 'error');
    }
  },
};

const Employees = {
  page: 1,
  filters: {},

  async load() {
    this.render();
  },

  async render() {
    const qs = new URLSearchParams({ page: this.page, limit: 20, ...this.filters }).toString();
    const { ok, data } = await API.get(`/employees?${qs}`);
    if (!ok) {
      document.getElementById('content-area').innerHTML = `<div class="alert alert-error">Failed to load employees.</div>`;
      return;
    }

    const canEdit = ['superadmin', 'itadmin'].includes(App.user.role);
    const rows = data.data.map(e => {
      const isResigned = e.status === 'resigned' || e.status === 'terminated';
      return `
      <tr>
        <td><strong>${e.employeeId}</strong></td>
        <td>${e.firstName} ${e.lastName}</td>
        <td><small>${e.email || '-'}</small></td>
        <td>${e.department || '-'}</td>
        <td>${e.position || '-'}</td>
        <td>${badge(e.status)}</td>
        <td>
          ${e.offboardingChecklist ? badge(e.offboardingChecklist.status) : (isResigned ? '<span class="badge badge-pending">pending</span>' : '-')}
        </td>
        <td class="table-actions">
          ${canEdit ? `
            <button class="btn btn-sm btn-secondary btn-icon" title="Edit" onclick="Employees.showEdit(${e.id})">✏️</button>
            ${e.status === 'active' ? `<button class="btn btn-sm btn-warning btn-icon" title="Offboard" onclick="Employees.offboard(${e.id},'${e.firstName} ${e.lastName}')">🚪</button>` : ''}
            ${isResigned ? `<button class="btn btn-sm btn-primary btn-icon" title="Checklist" onclick="Employees.showChecklist(${e.id})">☑️</button>` : ''}
            ${App.user.role === 'superadmin' ? `<button class="btn btn-sm btn-danger btn-icon" title="Delete" onclick="Employees.delete(${e.id},'${e.firstName}')">🗑️</button>` : ''}
          ` : ''}
        </td>
      </tr>`;
    }).join('') || `<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">👥</div><h3>No employees found</h3></div></td></tr>`;

    document.getElementById('content-area').innerHTML = `
      <div class="page-header">
        <h2>Employees</h2>
        ${canEdit ? `<button class="btn btn-primary" onclick="Employees.showAdd()">+ Add Employee</button>` : ''}
      </div>

      <div class="card">
        <div class="card-body">
          <div class="filters-bar">
            <input class="form-control search-input" placeholder="🔍 Search name, ID, email…"
              value="${this.filters.search || ''}"
              oninput="Employees.setFilter('search', this.value)">
            <input class="form-control" placeholder="Department" value="${this.filters.department || ''}"
              oninput="Employees.setFilter('department', this.value)">
            <select class="form-control" onchange="Employees.setFilter('status', this.value)">
              <option value="">All Statuses</option>
              ${['active','resigned','terminated'].map(s => `<option ${this.filters.status===s?'selected':''} value="${s}">${s}</option>`).join('')}
            </select>
            <button class="btn btn-secondary btn-sm" onclick="Employees.clearFilters()">Clear</button>
          </div>

          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>Employee ID</th><th>Name</th><th>Email</th><th>Department</th>
                <th>Position</th><th>Status</th><th>Offboarding</th><th>Actions</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          ${buildPagination(data.pagination, 'Employees.goPage')}
        </div>
      </div>`;
  },

  setFilter(key, val) {
    clearTimeout(this._filterTimer);
    this._filterTimer = setTimeout(() => {
      if (val) this.filters[key] = val;
      else delete this.filters[key];
      this.page = 1;
      this.render();
    }, 350);
  },

  clearFilters() {
    this.filters = {};
    this.page = 1;
    this.render();
  },

  goPage(p) { Employees.page = p; Employees.render(); },

  empForm(e = {}) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Employee ID *</label>
          <input class="form-control" id="f-employeeId" value="${e.employeeId||''}" placeholder="EMP001">
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="f-status">
            ${['active','resigned','terminated'].map(s => `<option ${e.status===s?'selected':''} value="${s}">${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">First Name *</label>
          <input class="form-control" id="f-firstName" value="${e.firstName||''}" placeholder="John">
        </div>
        <div class="form-group">
          <label class="form-label">Last Name *</label>
          <input class="form-control" id="f-lastName" value="${e.lastName||''}" placeholder="Doe">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-control" type="email" id="f-email" value="${e.email||''}" placeholder="john@company.com">
        </div>
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input class="form-control" id="f-phone" value="${e.phone||''}" placeholder="0891234567">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Department</label>
          <input class="form-control" id="f-department" value="${e.department||''}" placeholder="IT">
        </div>
        <div class="form-group">
          <label class="form-label">Position</label>
          <input class="form-control" id="f-position" value="${e.position||''}" placeholder="Software Engineer">
        </div>
      </div>`;
  },

  collectEmpForm() {
    return {
      employeeId: document.getElementById('f-employeeId').value.trim(),
      firstName: document.getElementById('f-firstName').value.trim(),
      lastName: document.getElementById('f-lastName').value.trim(),
      email: document.getElementById('f-email').value.trim(),
      phone: document.getElementById('f-phone').value.trim(),
      department: document.getElementById('f-department').value.trim(),
      position: document.getElementById('f-position').value.trim(),
      status: document.getElementById('f-status').value,
    };
  },

  showAdd() {
    Modal.show(this.empForm(), {
      title: 'Add Employee',
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="Employees.create()">Create Employee</button>`,
    });
  },

  async showEdit(id) {
    const { ok, data } = await API.get(`/employees/${id}`);
    if (!ok) return Toast.show('Failed to load employee', 'error');

    Modal.show(this.empForm(data.data), {
      title: 'Edit Employee',
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="Employees.update(${id})">Save Changes</button>`,
    });
  },

  async create() {
    const body = this.collectEmpForm();
    if (!body.employeeId || !body.firstName || !body.lastName) {
      return Toast.show('Employee ID, First Name, and Last Name are required', 'error');
    }
    const { ok, data } = await API.post('/employees', body);
    if (ok) {
      Modal.close();
      Toast.show('Employee created successfully', 'success');
      this.render();
    } else {
      Toast.show(data.message || 'Failed to create employee', 'error');
    }
  },

  async update(id) {
    const body = this.collectEmpForm();
    const { ok, data } = await API.put(`/employees/${id}`, body);
    if (ok) {
      Modal.close();
      Toast.show('Employee updated successfully', 'success');
      this.render();
    } else {
      Toast.show(data.message || 'Failed to update employee', 'error');
    }
  },

  async offboard(id, name) {
    const confirmed = await confirm(
      `Offboard "${name}"? This will mark them as resigned and create an offboarding checklist. An email notification will be sent.`,
      'Offboard Employee'
    );
    if (!confirmed) return;

    const { ok, data } = await API.put(`/employees/${id}/offboard`, {});
    if (ok) {
      Toast.show('Employee offboarded. Checklist created.', 'success');
      this.render();
    } else {
      Toast.show(data.message || 'Failed to offboard', 'error');
    }
  },

  async showChecklist(id) {
    const { ok, data } = await API.get(`/employees/${id}`);
    if (!ok) return Toast.show('Failed to load employee', 'error');

    const e = data.data;
    const cl = e.offboardingChecklist || {};

    const items = [
      { key: 'deviceReturned', label: 'Device Returned', icon: '📱' },
      { key: 'simStatusUpdated', label: 'SIM Status Updated', icon: '📶' },
      { key: 'accountsRevoked', label: 'Accounts Revoked', icon: '🔒' },
      { key: 'equipmentAudit', label: 'Equipment Audit Done', icon: '📋' },
    ];

    const checklistHtml = items.map(item => `
      <div class="checklist-item ${cl[item.key] ? 'done' : ''}" id="cl-${item.key}-container">
        <input type="checkbox" id="cl-${item.key}" ${cl[item.key] ? 'checked' : ''}
          onchange="Employees._checklistState['${item.key}'] = this.checked; this.closest('.checklist-item').classList.toggle('done', this.checked)">
        <span class="icon">${item.icon}</span>
        <span class="checklist-label">${item.label}</span>
      </div>`).join('');

    Employees._checklistState = {
      deviceReturned: !!cl.deviceReturned,
      simStatusUpdated: !!cl.simStatusUpdated,
      accountsRevoked: !!cl.accountsRevoked,
      equipmentAudit: !!cl.equipmentAudit,
    };

    Modal.show(`
      <div class="alert alert-info">Offboarding checklist for <strong>${e.firstName} ${e.lastName}</strong> (${e.employeeId})</div>
      <div id="checklist-items">${checklistHtml}</div>
      <div class="form-group mt-3">
        <label class="form-label">Notes</label>
        <textarea class="form-control" id="cl-notes" rows="3">${cl.notes||''}</textarea>
      </div>`, {
      title: 'Offboarding Checklist',
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Close</button>
        <button class="btn btn-primary" onclick="Employees.saveChecklist(${id})">Save Checklist</button>`,
    });
  },

  async saveChecklist(id) {
    const body = {
      ...Employees._checklistState,
      notes: document.getElementById('cl-notes').value,
    };
    const { ok, data } = await API.post(`/employees/${id}/offboarding-checklist`, body);
    if (ok) {
      Modal.close();
      Toast.show('Checklist updated', 'success');
      this.render();
    } else {
      Toast.show(data.message || 'Failed to save checklist', 'error');
    }
  },

  async delete(id, name) {
    const confirmed = await confirm(`Delete employee "${name}"? This cannot be undone.`, 'Delete Employee');
    if (!confirmed) return;
    const { ok, data } = await API.delete(`/employees/${id}`);
    if (ok) {
      Toast.show('Employee deleted', 'success');
      this.render();
    } else {
      Toast.show(data.message || 'Failed to delete', 'error');
    }
  },
};

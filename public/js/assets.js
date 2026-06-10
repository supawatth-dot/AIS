const Assets = {
  page: 1,
  filters: {},
  employees: [],

  async load() {
    await this.loadEmployees();
    this.render();
  },

  async loadEmployees() {
    const { ok, data } = await API.get('/employees?limit=500&status=active');
    if (ok) this.employees = data.data;
  },

  async render() {
    const qs = new URLSearchParams({ page: this.page, limit: 20, ...this.filters }).toString();
    const { ok, data } = await API.get(`/assets?${qs}`);
    if (!ok) {
      document.getElementById('content-area').innerHTML = `<div class="alert alert-error">Failed to load assets.</div>`;
      return;
    }

    const canEdit = ['superadmin', 'itadmin'].includes(App.user.role);
    const rows = data.data.map(a => `
      <tr>
        <td><strong>${a.assetTag}</strong></td>
        <td>${badge(a.type)}</td>
        <td>${a.brand || '-'} ${a.model || ''}</td>
        <td><small class="text-muted">${a.serialNumber || '-'}</small></td>
        <td><small>${a.imei || '-'}</small></td>
        <td>${a.phoneNumber || '-'}</td>
        <td>${badge(a.status, '')}</td>
        <td>${a.assignedEmployee ? `${a.assignedEmployee.firstName} ${a.assignedEmployee.lastName}` : '-'}</td>
        <td>${a.department || '-'}</td>
        <td class="table-actions">
          ${canEdit ? `
            <button class="btn btn-sm btn-secondary btn-icon" title="Edit" onclick="Assets.showEdit(${a.id})">✏️</button>
            <button class="btn btn-sm btn-danger btn-icon" title="Delete" onclick="Assets.delete(${a.id},'${a.assetTag}')">🗑️</button>
          ` : ''}
        </td>
      </tr>`).join('') || `<tr><td colspan="10"><div class="empty-state"><div class="empty-state-icon">📱</div><h3>No assets found</h3><p>Try adjusting your filters.</p></div></td></tr>`;

    document.getElementById('content-area').innerHTML = `
      <div class="page-header">
        <h2>Assets</h2>
        ${canEdit ? `<button class="btn btn-primary" onclick="Assets.showAdd()">+ Add Asset</button>` : ''}
      </div>

      <div class="card">
        <div class="card-body">
          <div class="filters-bar">
            <input class="form-control search-input" placeholder="🔍 Search tag, brand, serial, IMEI…"
              value="${this.filters.search || ''}"
              oninput="Assets.setFilter('search', this.value)">
            <select class="form-control" onchange="Assets.setFilter('type', this.value)">
              <option value="">All Types</option>
              ${['phone','tablet','sim','router','laptop','other'].map(t => `<option ${this.filters.type===t?'selected':''} value="${t}">${t}</option>`).join('')}
            </select>
            <select class="form-control" onchange="Assets.setFilter('status', this.value)">
              <option value="">All Statuses</option>
              ${['available','assigned','maintenance','retired'].map(s => `<option ${this.filters.status===s?'selected':''} value="${s}">${s}</option>`).join('')}
            </select>
            <input class="form-control" placeholder="Department" value="${this.filters.department || ''}"
              oninput="Assets.setFilter('department', this.value)">
            <button class="btn btn-secondary btn-sm" onclick="Assets.clearFilters()">Clear</button>
          </div>

          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>Asset Tag</th><th>Type</th><th>Brand/Model</th><th>Serial</th>
                <th>IMEI</th><th>Phone #</th><th>Status</th><th>Assigned To</th><th>Department</th><th>Actions</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          ${buildPagination(data.pagination, 'Assets.goPage')}
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

  goPage(p) {
    Assets.page = p;
    Assets.render();
  },

  assetForm(a = {}) {
    const empOptions = this.employees.map(e =>
      `<option value="${e.id}" ${a.assignedTo==e.id?'selected':''}>${e.firstName} ${e.lastName} (${e.employeeId})</option>`
    ).join('');

    return `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Asset Tag *</label>
          <input class="form-control" id="f-assetTag" value="${a.assetTag||''}" placeholder="AS-001">
        </div>
        <div class="form-group">
          <label class="form-label">Type *</label>
          <select class="form-control" id="f-type">
            ${['phone','tablet','sim','router','laptop','other'].map(t => `<option ${a.type===t?'selected':''} value="${t}">${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Brand</label>
          <input class="form-control" id="f-brand" value="${a.brand||''}" placeholder="Apple">
        </div>
        <div class="form-group">
          <label class="form-label">Model</label>
          <input class="form-control" id="f-model" value="${a.model||''}" placeholder="iPhone 14">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Serial Number</label>
          <input class="form-control" id="f-serialNumber" value="${a.serialNumber||''}" placeholder="SN123456">
        </div>
        <div class="form-group">
          <label class="form-label">IMEI</label>
          <input class="form-control" id="f-imei" value="${a.imei||''}" placeholder="356938035643809">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">SIM Number</label>
          <input class="form-control" id="f-simNumber" value="${a.simNumber||''}" placeholder="SIM001">
        </div>
        <div class="form-group">
          <label class="form-label">Phone Number</label>
          <input class="form-control" id="f-phoneNumber" value="${a.phoneNumber||''}" placeholder="0891234567">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="f-status">
            ${['available','assigned','maintenance','retired'].map(s => `<option ${a.status===s?'selected':''} value="${s}">${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Department</label>
          <input class="form-control" id="f-department" value="${a.department||''}" placeholder="IT">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Assigned To</label>
        <select class="form-control" id="f-assignedTo">
          <option value="">— Unassigned —</option>
          ${empOptions}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Purchase Date</label>
          <input class="form-control" type="date" id="f-purchaseDate" value="${a.purchaseDate ? a.purchaseDate.split('T')[0] : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Purchase Price (THB)</label>
          <input class="form-control" type="number" id="f-purchasePrice" value="${a.purchasePrice||''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Warranty Expiry</label>
        <input class="form-control" type="date" id="f-warrantyExpiry" value="${a.warrantyExpiry ? a.warrantyExpiry.split('T')[0] : ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-control" id="f-notes" rows="3">${a.notes||''}</textarea>
      </div>`;
  },

  collectForm() {
    return {
      assetTag: document.getElementById('f-assetTag').value.trim(),
      type: document.getElementById('f-type').value,
      brand: document.getElementById('f-brand').value.trim(),
      model: document.getElementById('f-model').value.trim(),
      serialNumber: document.getElementById('f-serialNumber').value.trim(),
      imei: document.getElementById('f-imei').value.trim(),
      simNumber: document.getElementById('f-simNumber').value.trim(),
      phoneNumber: document.getElementById('f-phoneNumber').value.trim(),
      status: document.getElementById('f-status').value,
      department: document.getElementById('f-department').value.trim(),
      assignedTo: document.getElementById('f-assignedTo').value || null,
      purchaseDate: document.getElementById('f-purchaseDate').value || null,
      purchasePrice: document.getElementById('f-purchasePrice').value || null,
      warrantyExpiry: document.getElementById('f-warrantyExpiry').value || null,
      notes: document.getElementById('f-notes').value.trim(),
    };
  },

  showAdd() {
    Modal.show(this.assetForm(), {
      title: 'Add Asset',
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="Assets.create()">Create Asset</button>`,
    });
  },

  async showEdit(id) {
    const { ok, data } = await API.get(`/assets/${id}`);
    if (!ok) return Toast.show('Failed to load asset', 'error');

    Modal.show(this.assetForm(data.data), {
      title: 'Edit Asset',
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="Assets.update(${id})">Save Changes</button>`,
    });
  },

  async create() {
    const body = this.collectForm();
    if (!body.assetTag) return Toast.show('Asset tag is required', 'error');

    const { ok, data } = await API.post('/assets', body);
    if (ok) {
      Modal.close();
      Toast.show('Asset created successfully', 'success');
      this.render();
    } else {
      Toast.show(data.message || 'Failed to create asset', 'error');
    }
  },

  async update(id) {
    const body = this.collectForm();
    const { ok, data } = await API.put(`/assets/${id}`, body);
    if (ok) {
      Modal.close();
      Toast.show('Asset updated successfully', 'success');
      this.render();
    } else {
      Toast.show(data.message || 'Failed to update asset', 'error');
    }
  },

  async delete(id, tag) {
    const confirmed = await confirm(`Delete asset "${tag}"? This cannot be undone.`, 'Delete Asset');
    if (!confirmed) return;

    const { ok, data } = await API.delete(`/assets/${id}`);
    if (ok) {
      Toast.show('Asset deleted', 'success');
      this.render();
    } else {
      Toast.show(data.message || 'Failed to delete', 'error');
    }
  },
};

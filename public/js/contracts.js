const Contracts = {
  page: 1,
  filters: {},

  async load() {
    this.render();
  },

  async render() {
    const qs = new URLSearchParams({ page: this.page, limit: 20, ...this.filters }).toString();
    const { ok, data } = await API.get(`/contracts?${qs}`);
    if (!ok) {
      document.getElementById('content-area').innerHTML = `<div class="alert alert-error">Failed to load contracts.</div>`;
      return;
    }

    const canEdit = ['superadmin', 'itadmin'].includes(App.user.role);
    const rows = data.data.map(c => {
      const days = daysUntil(c.endDate);
      const expClass = expiryClass(c.endDate);
      const daysLabel = days !== null ? (days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days}d left`) : '-';

      return `
      <tr>
        <td><strong>${c.contractNumber}</strong></td>
        <td>${c.provider}</td>
        <td>${badge(c.type)}</td>
        <td>${formatDate(c.startDate)}</td>
        <td class="${expClass}">${formatDate(c.endDate)}</td>
        <td class="${expClass} text-sm">${daysLabel}</td>
        <td>${c.monthlyRate ? `฿${formatCurrency(c.monthlyRate)}` : '-'}</td>
        <td>${badge(c.status)}</td>
        <td>${c.asset ? `${c.asset.assetTag} (${c.asset.type})` : '-'}</td>
        <td class="table-actions">
          ${canEdit ? `
            <button class="btn btn-sm btn-secondary btn-icon" title="Edit" onclick="Contracts.showEdit(${c.id})">✏️</button>
            <button class="btn btn-sm btn-danger btn-icon" title="Delete" onclick="Contracts.delete(${c.id},'${c.contractNumber}')">🗑️</button>
          ` : ''}
        </td>
      </tr>`;
    }).join('') || `<tr><td colspan="10"><div class="empty-state"><div class="empty-state-icon">📄</div><h3>No contracts found</h3></div></td></tr>`;

    document.getElementById('content-area').innerHTML = `
      <div class="page-header">
        <h2>Contracts</h2>
        ${canEdit ? `<button class="btn btn-primary" onclick="Contracts.showAdd()">+ Add Contract</button>` : ''}
      </div>

      <div class="card">
        <div class="card-body">
          <div class="filters-bar">
            <input class="form-control search-input" placeholder="🔍 Search contract #, provider…"
              value="${this.filters.search || ''}"
              oninput="Contracts.setFilter('search', this.value)">
            <input class="form-control" placeholder="Provider" value="${this.filters.provider || ''}"
              oninput="Contracts.setFilter('provider', this.value)">
            <select class="form-control" onchange="Contracts.setFilter('type', this.value)">
              <option value="">All Types</option>
              ${['mobile','internet','cloud','hardware'].map(t => `<option ${this.filters.type===t?'selected':''} value="${t}">${t}</option>`).join('')}
            </select>
            <select class="form-control" onchange="Contracts.setFilter('status', this.value)">
              <option value="">All Statuses</option>
              ${['active','expiring','expired'].map(s => `<option ${this.filters.status===s?'selected':''} value="${s}">${s}</option>`).join('')}
            </select>
            <select class="form-control" onchange="Contracts.setFilter('expiringDays', this.value)">
              <option value="">Any Expiry</option>
              <option ${this.filters.expiringDays==='7'?'selected':''} value="7">Expiring ≤ 7 days</option>
              <option ${this.filters.expiringDays==='30'?'selected':''} value="30">Expiring ≤ 30 days</option>
              <option ${this.filters.expiringDays==='60'?'selected':''} value="60">Expiring ≤ 60 days</option>
              <option ${this.filters.expiringDays==='90'?'selected':''} value="90">Expiring ≤ 90 days</option>
            </select>
            <button class="btn btn-secondary btn-sm" onclick="Contracts.clearFilters()">Clear</button>
          </div>

          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>Contract #</th><th>Provider</th><th>Type</th><th>Start</th>
                <th>End</th><th>Time Left</th><th>Monthly Rate</th><th>Status</th><th>Asset</th><th>Actions</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          ${buildPagination(data.pagination, 'Contracts.goPage')}
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

  clearFilters() { this.filters = {}; this.page = 1; this.render(); },
  goPage(p) { Contracts.page = p; Contracts.render(); },

  contractForm(c = {}) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Contract Number *</label>
          <input class="form-control" id="f-contractNumber" value="${c.contractNumber||''}" placeholder="CON-001">
        </div>
        <div class="form-group">
          <label class="form-label">Provider *</label>
          <input class="form-control" id="f-provider" value="${c.provider||''}" placeholder="AIS">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Type *</label>
          <select class="form-control" id="f-type">
            ${['mobile','internet','cloud','hardware'].map(t => `<option ${c.type===t?'selected':''} value="${t}">${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="f-status">
            ${['active','expiring','expired'].map(s => `<option ${c.status===s?'selected':''} value="${s}">${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Start Date</label>
          <input class="form-control" type="date" id="f-startDate" value="${c.startDate ? c.startDate.split('T')[0] : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">End Date</label>
          <input class="form-control" type="date" id="f-endDate" value="${c.endDate ? c.endDate.split('T')[0] : ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Monthly Rate (THB)</label>
          <input class="form-control" type="number" id="f-monthlyRate" value="${c.monthlyRate||''}">
        </div>
        <div class="form-group">
          <label class="form-label">Annual Rate (THB)</label>
          <input class="form-control" type="number" id="f-annualRate" value="${c.annualRate||''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-control" id="f-notes" rows="3">${c.notes||''}</textarea>
      </div>`;
  },

  collectForm() {
    return {
      contractNumber: document.getElementById('f-contractNumber').value.trim(),
      provider: document.getElementById('f-provider').value.trim(),
      type: document.getElementById('f-type').value,
      status: document.getElementById('f-status').value,
      startDate: document.getElementById('f-startDate').value || null,
      endDate: document.getElementById('f-endDate').value || null,
      monthlyRate: document.getElementById('f-monthlyRate').value || null,
      annualRate: document.getElementById('f-annualRate').value || null,
      notes: document.getElementById('f-notes').value.trim(),
    };
  },

  showAdd() {
    Modal.show(this.contractForm(), {
      title: 'Add Contract',
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="Contracts.create()">Create Contract</button>`,
    });
  },

  async showEdit(id) {
    const { ok, data } = await API.get(`/contracts/${id}`);
    if (!ok) return Toast.show('Failed to load contract', 'error');
    Modal.show(this.contractForm(data.data), {
      title: 'Edit Contract',
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="Contracts.update(${id})">Save Changes</button>`,
    });
  },

  async create() {
    const body = this.collectForm();
    if (!body.contractNumber || !body.provider) return Toast.show('Contract number and provider are required', 'error');
    const { ok, data } = await API.post('/contracts', body);
    if (ok) { Modal.close(); Toast.show('Contract created', 'success'); this.render(); }
    else Toast.show(data.message || 'Failed to create contract', 'error');
  },

  async update(id) {
    const body = this.collectForm();
    const { ok, data } = await API.put(`/contracts/${id}`, body);
    if (ok) { Modal.close(); Toast.show('Contract updated', 'success'); this.render(); }
    else Toast.show(data.message || 'Failed to update contract', 'error');
  },

  async delete(id, num) {
    const confirmed = await confirm(`Delete contract "${num}"?`, 'Delete Contract');
    if (!confirmed) return;
    const { ok, data } = await API.delete(`/contracts/${id}`);
    if (ok) { Toast.show('Contract deleted', 'success'); this.render(); }
    else Toast.show(data.message || 'Failed to delete', 'error');
  },
};

const AuditLogs = {
  page: 1,
  filters: {},

  async load() {
    this.render();
  },

  async render() {
    const qs = new URLSearchParams({ page: this.page, limit: 50, ...this.filters }).toString();
    const { ok, data } = await API.get(`/audit-logs?${qs}`);
    if (!ok) {
      document.getElementById('content-area').innerHTML = `<div class="alert alert-error">Failed to load audit logs.</div>`;
      return;
    }

    const rows = data.data.map((log, i) => {
      const hasChanges = log.oldValues || log.newValues;
      return `
      <tr>
        <td><small class="text-muted">${new Date(log.createdAt).toLocaleString()}</small></td>
        <td><span class="audit-action audit-${log.action}">${log.action}</span></td>
        <td>${badge(log.entity)}</td>
        <td><small class="text-muted">#${log.entityId}</small></td>
        <td>${log.user ? log.user.username : (log.userName || '-')}</td>
        <td><small class="text-muted">${log.ipAddress || '-'}</small></td>
        <td>
          ${hasChanges ? `
            <button class="btn btn-sm btn-secondary" onclick="AuditLogs.showDiff(${i})">View Changes</button>
          ` : '-'}
        </td>
      </tr>`;
    }).join('') || `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">📋</div><h3>No audit logs found</h3></div></td></tr>`;

    // Store for diff viewing
    AuditLogs._data = data.data;

    document.getElementById('content-area').innerHTML = `
      <div class="page-header">
        <h2>Audit Logs</h2>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="filters-bar">
            <select class="form-control" onchange="AuditLogs.setFilter('entity', this.value)">
              <option value="">All Entities</option>
              ${['asset','employee','contract','user'].map(e => `<option ${this.filters.entity===e?'selected':''} value="${e}">${e}</option>`).join('')}
            </select>
            <select class="form-control" onchange="AuditLogs.setFilter('action', this.value)">
              <option value="">All Actions</option>
              ${['CREATE','UPDATE','DELETE','IMPORT','OFFBOARD'].map(a => `<option ${this.filters.action===a?'selected':''} value="${a}">${a}</option>`).join('')}
            </select>
            <div style="display:flex;gap:6px;align-items:center">
              <input class="form-control" type="date" placeholder="From" value="${this.filters.dateFrom||''}"
                onchange="AuditLogs.setFilter('dateFrom', this.value)">
              <span class="text-muted">–</span>
              <input class="form-control" type="date" placeholder="To" value="${this.filters.dateTo||''}"
                onchange="AuditLogs.setFilter('dateTo', this.value)">
            </div>
            <button class="btn btn-secondary btn-sm" onclick="AuditLogs.clearFilters()">Clear</button>
          </div>

          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>Timestamp</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>User</th><th>IP</th><th>Changes</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          ${buildPagination(data.pagination, 'AuditLogs.goPage')}
        </div>
      </div>`;
  },

  setFilter(key, val) {
    if (val) this.filters[key] = val;
    else delete this.filters[key];
    this.page = 1;
    this.render();
  },

  clearFilters() { this.filters = {}; this.page = 1; this.render(); },
  goPage(p) { AuditLogs.page = p; AuditLogs.render(); },

  showDiff(index) {
    const log = AuditLogs._data[index];
    const formatJSON = (obj) => {
      if (!obj) return '<em class="text-muted">none</em>';
      try {
        const parsed = typeof obj === 'string' ? JSON.parse(obj) : obj;
        return JSON.stringify(parsed, null, 2);
      } catch {
        return String(obj);
      }
    };

    Modal.show(`
      <div class="mb-3">
        <strong>Action:</strong> <span class="audit-action audit-${log.action}">${log.action}</span>
        &nbsp; <strong>Entity:</strong> ${log.entity} #${log.entityId}
        &nbsp; <strong>By:</strong> ${log.user ? log.user.username : log.userName}
        &nbsp; <strong>At:</strong> ${new Date(log.createdAt).toLocaleString()}
      </div>
      <div class="form-row">
        <div>
          <div class="form-label">Before</div>
          <pre class="json-diff">${formatJSON(log.oldValues)}</pre>
        </div>
        <div>
          <div class="form-label">After</div>
          <pre class="json-diff">${formatJSON(log.newValues)}</pre>
        </div>
      </div>`, {
      title: 'Change Details',
      large: true,
      footer: `<button class="btn btn-secondary" onclick="Modal.close()">Close</button>`,
    });
  },
};

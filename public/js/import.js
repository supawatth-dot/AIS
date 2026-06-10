const Import = {
  activeTab: 'assets',

  load() {
    document.getElementById('content-area').innerHTML = `
      <div class="page-header">
        <h2>Import Data</h2>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="tabs">
            <button class="tab-btn active" onclick="Import.switchTab('assets', this)">📱 Assets</button>
            <button class="tab-btn" onclick="Import.switchTab('employees', this)">👥 Employees</button>
            <button class="tab-btn" onclick="Import.switchTab('contracts', this)">📄 Contracts</button>
          </div>

          <div id="import-content"></div>
        </div>
      </div>`;

    this.renderTab('assets');
  },

  switchTab(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.activeTab = tab;
    this.renderTab(tab);
  },

  renderTab(tab) {
    const labels = { assets: 'Assets', employees: 'Employees', contracts: 'Contracts' };
    document.getElementById('import-content').innerHTML = `
      <div class="d-flex justify-between align-center mb-3">
        <div>
          <p class="text-muted">Upload an Excel file (.xlsx) to bulk import ${labels[tab]}.</p>
        </div>
        <a class="btn btn-secondary" href="/api/import/template/${tab}" download>
          📥 Download Template
        </a>
      </div>

      <div class="upload-area" id="upload-area-${tab}"
        ondragover="Import.dragOver(event)" ondragleave="Import.dragLeave(event)" ondrop="Import.drop(event,'${tab}')">
        <div class="upload-icon">📄</div>
        <div class="upload-text">
          Drag & drop your Excel file here, or
          <strong onclick="document.getElementById('file-input-${tab}').click()">browse</strong>
        </div>
        <input type="file" id="file-input-${tab}" accept=".xlsx,.xls,.csv" style="display:none"
          onchange="Import.handleFile(this, '${tab}')">
        <div class="mt-2 text-sm text-muted">Supported: .xlsx, .xls, .csv · Max 10MB</div>
      </div>

      <div id="import-results-${tab}"></div>`;
  },

  dragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragging');
  },

  dragLeave(e) {
    e.currentTarget.classList.remove('dragging');
  },

  drop(e, tab) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    if (file) this.uploadFile(file, tab);
  },

  handleFile(input, tab) {
    const file = input.files[0];
    if (file) this.uploadFile(file, tab);
  },

  async uploadFile(file, tab) {
    const resultsEl = document.getElementById(`import-results-${tab}`);
    resultsEl.innerHTML = `<div class="loading-overlay"><div class="spinner"></div><span>Importing…</span></div>`;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { ok, data } = await API.postForm(`/import/${tab}`, formData);
      if (ok) {
        const { results } = data;
        const errRows = results.errors.map(e => `
          <tr>
            <td>${e.row}</td>
            <td class="expiry-critical">${e.error}</td>
            <td><small class="text-muted">${JSON.stringify(e.data).slice(0, 80)}…</small></td>
          </tr>`).join('');

        resultsEl.innerHTML = `
          <div class="mt-3">
            <div class="alert ${results.success > 0 ? 'alert-success' : 'alert-warning'}">
              ✅ <strong>${results.success}</strong> records imported successfully
              ${results.errors.length > 0 ? ` &nbsp; ❌ <strong>${results.errors.length}</strong> rows failed` : ''}
            </div>
            ${results.errors.length > 0 ? `
              <div class="card">
                <div class="card-header"><span class="card-title">Import Errors</span></div>
                <div class="table-wrapper">
                  <table>
                    <thead><tr><th>Row</th><th>Error</th><th>Data</th></tr></thead>
                    <tbody>${errRows}</tbody>
                  </table>
                </div>
              </div>
            ` : ''}
          </div>`;
      } else {
        resultsEl.innerHTML = `<div class="alert alert-error mt-3">${data.message || 'Import failed'}</div>`;
      }
    } catch (err) {
      resultsEl.innerHTML = `<div class="alert alert-error mt-3">Network error during import</div>`;
    }
  },
};

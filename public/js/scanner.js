const Scanner = {
  html5QrCode: null,
  scanning: false,
  history: [],

  load() {
    document.getElementById('content-area').innerHTML = `
      <div class="page-header">
        <h2>Barcode / QR Scanner</h2>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">
        <div class="card">
          <div class="card-header">
            <span class="card-title">📷 Camera Scanner</span>
            <div>
              <button id="scanner-start-btn" class="btn btn-primary btn-sm" onclick="Scanner.start()">Start Camera</button>
              <button id="scanner-stop-btn" class="btn btn-secondary btn-sm" onclick="Scanner.stop()" style="display:none">Stop</button>
            </div>
          </div>
          <div class="card-body">
            <div id="scanner-reader"></div>
            <div id="scan-result" style="display:none" class="scan-result mt-3">
              <div class="fw-bold mb-1">Last Scan:</div>
              <div id="scan-value" class="fw-bold" style="font-size:18px;color:var(--primary)"></div>
              <div class="mt-2">
                <button class="btn btn-primary btn-sm" onclick="Scanner.findAsset()">🔍 Find Asset</button>
                <button class="btn btn-secondary btn-sm" onclick="Scanner.copyValue()">📋 Copy</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">📋 Scan History</span>
            <button class="btn btn-secondary btn-sm" onclick="Scanner.clearHistory()">Clear</button>
          </div>
          <div class="card-body" id="scanner-history">
            <div class="empty-state" style="padding:30px">
              <div class="empty-state-icon">📷</div>
              <p class="text-muted">No scans yet</p>
            </div>
          </div>
        </div>
      </div>

      <div id="scanner-asset-result" class="mt-3"></div>`;
  },

  async start() {
    if (this.scanning) return;
    if (!window.Html5Qrcode) {
      Toast.show('Scanner library not loaded. Check your connection.', 'error');
      return;
    }

    try {
      this.html5QrCode = new Html5Qrcode('scanner-reader');
      await this.html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 180 } },
        (decodedText) => this.onScan(decodedText),
        (err) => {}
      );

      this.scanning = true;
      document.getElementById('scanner-start-btn').style.display = 'none';
      document.getElementById('scanner-stop-btn').style.display = 'inline-flex';
    } catch (err) {
      Toast.show('Camera access denied or not available: ' + err, 'error');
    }
  },

  stop() {
    if (this.html5QrCode && this.scanning) {
      this.html5QrCode.stop().catch(() => {});
      this.scanning = false;
    }
    const startBtn = document.getElementById('scanner-start-btn');
    const stopBtn = document.getElementById('scanner-stop-btn');
    if (startBtn) startBtn.style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'none';
  },

  onScan(value) {
    // Deduplicate rapid scans
    if (this.lastScan === value && Date.now() - this.lastScanTime < 2000) return;
    this.lastScan = value;
    this.lastScanTime = Date.now();

    this.history.unshift({ value, time: new Date() });
    if (this.history.length > 20) this.history.pop();

    const resultEl = document.getElementById('scan-result');
    const valueEl = document.getElementById('scan-value');
    if (resultEl) { resultEl.style.display = 'block'; valueEl.textContent = value; }

    this.renderHistory();
    Toast.show(`Scanned: ${value}`, 'success', 2000);
  },

  renderHistory() {
    const el = document.getElementById('scanner-history');
    if (!el || !this.history.length) return;
    el.innerHTML = this.history.map(h => `
      <div class="scan-history-item">
        <div>
          <div class="fw-bold" style="font-size:13px">${h.value}</div>
          <div class="text-sm text-muted">${new Date(h.time).toLocaleTimeString()}</div>
        </div>
        <div>
          <button class="btn btn-sm btn-secondary" onclick="Scanner.findAssetByValue('${h.value.replace(/'/g, "\\'")}')">Find</button>
        </div>
      </div>`).join('');
  },

  clearHistory() {
    this.history = [];
    const el = document.getElementById('scanner-history');
    if (el) el.innerHTML = `<div class="empty-state" style="padding:30px"><div class="empty-state-icon">📷</div><p class="text-muted">No scans yet</p></div>`;
  },

  async findAsset() {
    const val = document.getElementById('scan-value')?.textContent;
    if (!val) return;
    this.findAssetByValue(val);
  },

  async findAssetByValue(value) {
    const resultEl = document.getElementById('scanner-asset-result');
    if (!resultEl) return;
    resultEl.innerHTML = `<div class="loading-overlay"><div class="spinner"></div><span>Searching…</span></div>`;

    const { ok, data } = await API.get(`/assets?search=${encodeURIComponent(value)}&limit=5`);
    if (!ok || !data.data.length) {
      resultEl.innerHTML = `<div class="alert alert-warning">No asset found for: <strong>${value}</strong></div>`;
      return;
    }

    const rows = data.data.map(a => `
      <tr>
        <td><strong>${a.assetTag}</strong></td>
        <td>${badge(a.type)}</td>
        <td>${a.brand||''} ${a.model||''}</td>
        <td>${a.serialNumber||'-'}</td>
        <td>${a.imei||'-'}</td>
        <td>${badge(a.status)}</td>
        <td>${a.assignedEmployee ? `${a.assignedEmployee.firstName} ${a.assignedEmployee.lastName}` : '-'}</td>
      </tr>`).join('');

    resultEl.innerHTML = `
      <div class="card">
        <div class="card-header"><span class="card-title">🔍 Search Results for "${value}"</span></div>
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Tag</th><th>Type</th><th>Model</th><th>Serial</th><th>IMEI</th><th>Status</th><th>Assigned To</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  },

  copyValue() {
    const val = document.getElementById('scan-value')?.textContent;
    if (val && navigator.clipboard) {
      navigator.clipboard.writeText(val);
      Toast.show('Copied to clipboard', 'success', 1500);
    }
  },
};

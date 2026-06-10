const Dashboard = {
  charts: {},

  async load() {
    const { ok, data } = await API.get('/dashboard/stats');
    if (!ok) {
      document.getElementById('content-area').innerHTML = `<div class="alert alert-error">Failed to load dashboard data.</div>`;
      return;
    }

    const d = data.data;
    document.getElementById('content-area').innerHTML = this.template(d);
    this.renderCharts(d);
  },

  template(d) {
    return `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">📱</div>
          <div>
            <div class="stat-value">${d.totalAssets}</div>
            <div class="stat-label">Total Assets</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">✅</div>
          <div>
            <div class="stat-value">${d.assignedAssets}</div>
            <div class="stat-label">Assigned</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon cyan">📦</div>
          <div>
            <div class="stat-value">${d.availableAssets}</div>
            <div class="stat-label">Available</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange">🔧</div>
          <div>
            <div class="stat-value">${d.maintenanceAssets}</div>
            <div class="stat-label">In Maintenance</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">👥</div>
          <div>
            <div class="stat-value">${d.activeEmployees}</div>
            <div class="stat-label">Active Employees</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">⚠️</div>
          <div>
            <div class="stat-value">${d.expiringContracts}</div>
            <div class="stat-label">Expiring Contracts</div>
          </div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-title">📈 Monthly Telecom Spending (Last 12 Months)</div>
          <div class="chart-container"><canvas id="chart-spending"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">📱 Device Lifecycle by Type</div>
          <div class="chart-container"><canvas id="chart-lifecycle"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">📄 Expiring Contracts</div>
          <div class="chart-container"><canvas id="chart-expiring"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">🏢 Department Asset Usage</div>
          <div class="chart-container"><canvas id="chart-dept"></canvas></div>
        </div>
      </div>
    `;
  },

  renderCharts(d) {
    const palette = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2','#db2777','#059669'];

    // Monthly Spending
    const spendingCtx = document.getElementById('chart-spending');
    if (spendingCtx && d.monthlySpending) {
      this.charts.spending = new Chart(spendingCtx, {
        type: 'line',
        data: {
          labels: d.monthlySpending.map(m => m.label),
          datasets: [{
            label: 'Monthly Spending (THB)',
            data: d.monthlySpending.map(m => m.total),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.08)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#2563eb',
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: v => v.toLocaleString() },
              grid: { color: '#f1f5f9' },
            },
            x: { grid: { display: false } },
          },
        },
      });
    }

    // Device Lifecycle
    const lifecycleCtx = document.getElementById('chart-lifecycle');
    if (lifecycleCtx && d.deviceLifecycle) {
      const labels = Object.keys(d.deviceLifecycle);
      const values = Object.values(d.deviceLifecycle);
      this.charts.lifecycle = new Chart(lifecycleCtx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data: values, backgroundColor: palette.slice(0, labels.length), borderWidth: 2, borderColor: '#fff' }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { boxWidth: 12, font: { size: 12 } } },
          },
          cutout: '65%',
        },
      });
    }

    // Expiring Contracts
    const expiringCtx = document.getElementById('chart-expiring');
    if (expiringCtx && d.expiringBuckets) {
      this.charts.expiring = new Chart(expiringCtx, {
        type: 'bar',
        data: {
          labels: d.expiringBuckets.map(b => `≤${b.days} days`),
          datasets: [{
            label: 'Contracts',
            data: d.expiringBuckets.map(b => b.count),
            backgroundColor: ['#fca5a5','#fb923c','#fbbf24','#a3e635','#34d399'],
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false } },
          },
        },
      });
    }

    // Department Usage
    const deptCtx = document.getElementById('chart-dept');
    if (deptCtx && d.departmentUsage) {
      const labels = Object.keys(d.departmentUsage);
      const values = Object.values(d.departmentUsage);
      this.charts.dept = new Chart(deptCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Assets',
            data: values,
            backgroundColor: '#2563eb',
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
            y: { grid: { display: false } },
          },
        },
      });
    }
  },
};

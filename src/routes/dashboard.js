const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');
const { Asset, Employee, Contract, sequelize } = require('../models');
const { verifyToken } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', verifyToken, async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const todayStr = now.toISOString().split('T')[0];
    const thirtyStr = thirtyDaysLater.toISOString().split('T')[0];

    // Basic counts
    const [
      totalAssets,
      assignedAssets,
      availableAssets,
      maintenanceAssets,
      totalEmployees,
      activeEmployees,
      totalContracts,
      activeContracts,
      expiringContracts,
    ] = await Promise.all([
      Asset.count(),
      Asset.count({ where: { status: 'assigned' } }),
      Asset.count({ where: { status: 'available' } }),
      Asset.count({ where: { status: 'maintenance' } }),
      Employee.count(),
      Employee.count({ where: { status: 'active' } }),
      Contract.count(),
      Contract.count({ where: { status: 'active' } }),
      Contract.count({ where: { endDate: { [Op.between]: [todayStr, thirtyStr] } } }),
    ]);

    // Monthly spending last 12 months
    const monthlySpending = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
      const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

      const result = await Contract.sum('monthlyRate', {
        where: {
          status: { [Op.ne]: 'expired' },
          startDate: { [Op.lte]: monthStart },
          [Op.or]: [
            { endDate: { [Op.gte]: monthStart } },
            { endDate: null },
          ],
        },
      });

      monthlySpending.push({
        month: `${year}-${String(month).padStart(2, '0')}`,
        label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        total: parseFloat(result || 0),
      });
    }

    // Device lifecycle by type
    const assetsByType = await Asset.findAll({
      attributes: ['type', [fn('COUNT', col('id')), 'count']],
      group: ['type'],
      raw: true,
    });
    const deviceLifecycle = {};
    assetsByType.forEach(r => { deviceLifecycle[r.type] = parseInt(r.count); });

    // Department usage
    const deptUsage = await Asset.findAll({
      attributes: ['department', [fn('COUNT', col('id')), 'count']],
      where: { department: { [Op.ne]: null } },
      group: ['department'],
      raw: true,
    });
    const departmentUsage = {};
    deptUsage.forEach(r => { if (r.department) departmentUsage[r.department] = parseInt(r.count); });

    // Contracts by status
    const contractsByStatusRaw = await Contract.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });
    const contractsByStatus = {};
    contractsByStatusRaw.forEach(r => { contractsByStatus[r.status] = parseInt(r.count); });

    // Expiring contracts bucketed
    const buckets = [7, 14, 30, 60, 90];
    const expiringBuckets = await Promise.all(buckets.map(async (days) => {
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + days);
      const count = await Contract.count({
        where: {
          endDate: { [Op.between]: [from.toISOString().split('T')[0], to.toISOString().split('T')[0]] },
          status: { [Op.ne]: 'expired' },
        },
      });
      return { days, count };
    }));

    res.json({
      success: true,
      data: {
        totalAssets,
        assignedAssets,
        availableAssets,
        maintenanceAssets,
        totalEmployees,
        activeEmployees,
        totalContracts,
        activeContracts,
        expiringContracts,
        monthlySpending,
        deviceLifecycle,
        departmentUsage,
        contractsByStatus,
        expiringBuckets,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

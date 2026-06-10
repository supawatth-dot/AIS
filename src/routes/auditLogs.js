const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { AuditLog, User } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// GET /api/audit-logs
router.get('/', verifyToken, requireRole('itadmin', 'superadmin'), async (req, res, next) => {
  try {
    const { entity, userId, dateFrom, dateTo, action, page = 1, limit = 50 } = req.query;
    const where = {};

    if (entity) where.entity = entity;
    if (userId) where.userId = userId;
    if (action) where.action = action;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'], required: false }],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

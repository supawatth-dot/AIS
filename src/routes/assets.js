const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { body } = require('express-validator');
const { Asset, Employee } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { handleValidationErrors } = require('../middleware/validate');
const { createLog } = require('../services/auditService');

const assetValidation = [
  body('assetTag').trim().notEmpty().withMessage('Asset tag required'),
  body('type').isIn(['phone', 'tablet', 'sim', 'router', 'laptop', 'other']).withMessage('Invalid type'),
  handleValidationErrors,
];

// GET /api/assets
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { search, department, status, type, page = 1, limit = 20 } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { assetTag: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } },
        { model: { [Op.like]: `%${search}%` } },
        { serialNumber: { [Op.like]: `%${search}%` } },
        { imei: { [Op.like]: `%${search}%` } },
        { phoneNumber: { [Op.like]: `%${search}%` } },
      ];
    }
    if (department) where.department = department;
    if (status) where.status = status;
    if (type) where.type = type;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Asset.findAndCountAll({
      where,
      include: [{ model: Employee, as: 'assignedEmployee', attributes: ['id', 'employeeId', 'firstName', 'lastName', 'department'] }],
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

// GET /api/assets/:id
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const asset = await Asset.findByPk(req.params.id, {
      include: [{ model: Employee, as: 'assignedEmployee' }],
    });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    res.json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
});

// POST /api/assets
router.post('/', verifyToken, requireRole('itadmin', 'superadmin'), assetValidation, async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user.id, updatedBy: req.user.id };
    const asset = await Asset.create(data);
    await createLog('CREATE', 'asset', asset.id, req, null, asset.toJSON());
    res.status(201).json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
});

// PUT /api/assets/:id
router.put('/:id', verifyToken, requireRole('itadmin', 'superadmin'), async (req, res, next) => {
  try {
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    const oldValues = asset.toJSON();
    const data = { ...req.body, updatedBy: req.user.id };
    await asset.update(data);
    await createLog('UPDATE', 'asset', asset.id, req, oldValues, asset.toJSON());
    res.json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/assets/:id
router.delete('/:id', verifyToken, requireRole('itadmin', 'superadmin'), async (req, res, next) => {
  try {
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    const oldValues = asset.toJSON();
    await asset.destroy();
    await createLog('DELETE', 'asset', req.params.id, req, oldValues, null);
    res.json({ success: true, message: 'Asset deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

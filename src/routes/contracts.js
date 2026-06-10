const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { body } = require('express-validator');
const { Contract, Asset } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { handleValidationErrors } = require('../middleware/validate');
const { createLog } = require('../services/auditService');

// GET /api/contracts
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { search, provider, status, type, expiringDays, page = 1, limit = 20 } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { contractNumber: { [Op.like]: `%${search}%` } },
        { provider: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } },
      ];
    }
    if (provider) where.provider = { [Op.like]: `%${provider}%` };
    if (status) where.status = status;
    if (type) where.type = type;

    if (expiringDays) {
      const days = parseInt(expiringDays);
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + days);
      where.endDate = { [Op.between]: [now.toISOString().split('T')[0], future.toISOString().split('T')[0]] };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Contract.findAndCountAll({
      where,
      include: [{ model: Asset, as: 'asset', attributes: ['id', 'assetTag', 'type', 'brand', 'model'], required: false }],
      limit: parseInt(limit),
      offset,
      order: [['endDate', 'ASC']],
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

// GET /api/contracts/:id
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const contract = await Contract.findByPk(req.params.id, {
      include: [{ model: Asset, as: 'asset' }],
    });
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });
    res.json({ success: true, data: contract });
  } catch (err) {
    next(err);
  }
});

// POST /api/contracts
router.post('/', verifyToken, requireRole('itadmin', 'superadmin'), [
  body('contractNumber').trim().notEmpty().withMessage('Contract number required'),
  body('provider').trim().notEmpty().withMessage('Provider required'),
  body('type').isIn(['mobile', 'internet', 'cloud', 'hardware']).withMessage('Invalid type'),
  handleValidationErrors,
], async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user.id };
    const contract = await Contract.create(data);
    await createLog('CREATE', 'contract', contract.id, req, null, contract.toJSON());
    res.status(201).json({ success: true, data: contract });
  } catch (err) {
    next(err);
  }
});

// PUT /api/contracts/:id
router.put('/:id', verifyToken, requireRole('itadmin', 'superadmin'), async (req, res, next) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });

    const oldValues = contract.toJSON();
    await contract.update(req.body);
    await createLog('UPDATE', 'contract', contract.id, req, oldValues, contract.toJSON());
    res.json({ success: true, data: contract });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/contracts/:id
router.delete('/:id', verifyToken, requireRole('itadmin', 'superadmin'), async (req, res, next) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });

    const oldValues = contract.toJSON();
    await contract.destroy();
    await createLog('DELETE', 'contract', req.params.id, req, oldValues, null);
    res.json({ success: true, message: 'Contract deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { body } = require('express-validator');
const { Employee, Asset, OffboardingChecklist, User } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { handleValidationErrors } = require('../middleware/validate');
const { createLog } = require('../services/auditService');
const { sendOffboardingAlert } = require('../services/emailService');

// GET /api/employees
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { search, department, status, page = 1, limit = 20 } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { employeeId: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { department: { [Op.like]: `%${search}%` } },
      ];
    }
    if (department) where.department = department;
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Employee.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: OffboardingChecklist, as: 'offboardingChecklist', required: false }],
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

// GET /api/employees/:id
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        { model: Asset, as: 'assets' },
        { model: OffboardingChecklist, as: 'offboardingChecklist' },
      ],
    });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
});

// POST /api/employees
router.post('/', verifyToken, requireRole('itadmin', 'superadmin'), [
  body('employeeId').trim().notEmpty().withMessage('Employee ID required'),
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required'),
  handleValidationErrors,
], async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user.id };
    const employee = await Employee.create(data);
    await createLog('CREATE', 'employee', employee.id, req, null, employee.toJSON());
    res.status(201).json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
});

// PUT /api/employees/:id
router.put('/:id', verifyToken, requireRole('itadmin', 'superadmin'), async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const oldValues = employee.toJSON();
    await employee.update(req.body);
    await createLog('UPDATE', 'employee', employee.id, req, oldValues, employee.toJSON());
    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
});

// PUT /api/employees/:id/offboard
router.put('/:id/offboard', verifyToken, requireRole('itadmin', 'superadmin'), async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    if (employee.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Employee is not active' });
    }

    const oldValues = employee.toJSON();
    await employee.update({ status: 'resigned', resignedAt: new Date() });

    // Create offboarding checklist
    const existing = await OffboardingChecklist.findOne({ where: { employeeId: employee.id } });
    if (!existing) {
      await OffboardingChecklist.create({
        employeeId: employee.id,
        status: 'pending',
      });
    }

    // Send notification email
    let manager = null;
    if (employee.managerId) {
      manager = await Employee.findByPk(employee.managerId);
    }
    sendOffboardingAlert(employee, manager).catch(() => {});

    await createLog('OFFBOARD', 'employee', employee.id, req, oldValues, employee.toJSON());
    res.json({ success: true, data: employee, message: 'Employee offboarded successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/employees/:id/offboarding-checklist
router.post('/:id/offboarding-checklist', verifyToken, requireRole('itadmin', 'superadmin'), async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    let checklist = await OffboardingChecklist.findOne({ where: { employeeId: employee.id } });
    if (!checklist) {
      checklist = await OffboardingChecklist.create({ employeeId: employee.id });
    }

    const { deviceReturned, simStatusUpdated, accountsRevoked, equipmentAudit, notes } = req.body;
    const updates = {};
    if (deviceReturned !== undefined) updates.deviceReturned = deviceReturned;
    if (simStatusUpdated !== undefined) updates.simStatusUpdated = simStatusUpdated;
    if (accountsRevoked !== undefined) updates.accountsRevoked = accountsRevoked;
    if (equipmentAudit !== undefined) updates.equipmentAudit = equipmentAudit;
    if (notes !== undefined) updates.notes = notes;
    updates.completedBy = req.user.id;

    // Auto-set status
    const merged = { ...checklist.toJSON(), ...updates };
    if (merged.deviceReturned && merged.simStatusUpdated && merged.accountsRevoked && merged.equipmentAudit) {
      updates.status = 'completed';
      updates.completedAt = new Date();
    } else if (merged.deviceReturned || merged.simStatusUpdated || merged.accountsRevoked || merged.equipmentAudit) {
      updates.status = 'inprogress';
    }

    await checklist.update(updates);
    res.json({ success: true, data: checklist });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/employees/:id
router.delete('/:id', verifyToken, requireRole('superadmin'), async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const oldValues = employee.toJSON();
    await employee.destroy();
    await createLog('DELETE', 'employee', req.params.id, req, oldValues, null);
    res.json({ success: true, message: 'Employee deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

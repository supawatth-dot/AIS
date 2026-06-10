const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { User } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { handleValidationErrors } = require('../middleware/validate');
const { sendWelcomeEmail } = require('../services/emailService');

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  handleValidationErrors,
], async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register - superadmin only
router.post('/register', [
  verifyToken,
  requireRole('superadmin'),
  body('username').trim().notEmpty().withMessage('Username required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['superadmin', 'itadmin', 'viewer']).withMessage('Invalid role'),
  handleValidationErrors,
], async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const user = await User.create({ username, email, password, role, isActive: true });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user).catch(() => {});

    res.status(201).json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

// GET /api/auth/users - superadmin only
router.get('/users', verifyToken, requireRole('superadmin'), async (req, res, next) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/users/:id/toggle - superadmin only
router.put('/users/:id/toggle', verifyToken, requireRole('superadmin'), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate yourself' });
    }

    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/users/:id/reset-password - superadmin only
router.put('/users/:id/reset-password', [
  verifyToken,
  requireRole('superadmin'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
], async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = req.body.password;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

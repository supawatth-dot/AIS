const { AuditLog } = require('../models');

const createLog = async (action, entity, entityId, req, oldValues = null, newValues = null) => {
  try {
    await AuditLog.create({
      action,
      entity,
      entityId,
      userId: req.user ? req.user.id : null,
      userName: req.user ? (req.user.username || req.user.email) : 'system',
      oldValues,
      newValues,
      ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { createLog };

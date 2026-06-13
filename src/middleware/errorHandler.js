const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  // Log all errors with context
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    user: req.user?.id,
    statusCode,
  });

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors ? err.errors.map(e => e.message) : [err.message],
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Cannot complete action: a related record is referenced.',
    });
  }

  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      success: false,
      message: isProd ? 'Database error' : err.message,
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large (max 10MB)' });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(isProd ? {} : { stack: err.stack }),
  });
};

module.exports = errorHandler;

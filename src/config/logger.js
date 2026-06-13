const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        consoleFormat
      ),
    }),
  ],
});

// Write to log files in production
if (process.env.NODE_ENV === 'production') {
  const logDir = process.env.LOG_DIR || './logs';
  logger.add(new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true,
  }));
  logger.add(new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    maxsize: 20 * 1024 * 1024, // 20MB
    maxFiles: 10,
    tailable: true,
  }));
}

module.exports = logger;

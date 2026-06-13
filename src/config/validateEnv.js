const logger = require('./logger');

const REQUIRED_IN_PRODUCTION = ['JWT_SECRET', 'DATABASE_URL'];
const WARNINGS = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];

function validateEnv() {
  const env = process.env.NODE_ENV || 'development';
  let valid = true;

  // Critical: JWT_SECRET must not be default value in production
  if (env === 'production') {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!process.env[key]) {
        logger.error(`Missing required environment variable: ${key}`);
        valid = false;
      }
    }

    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      logger.error('JWT_SECRET must be at least 32 characters in production');
      valid = false;
    }

    const insecureSecrets = ['your-super-secret', 'change-me', 'secret', '123456'];
    if (insecureSecrets.some(s => (process.env.JWT_SECRET || '').toLowerCase().includes(s))) {
      logger.error('JWT_SECRET appears to be a default/insecure value. Change it before deploying!');
      valid = false;
    }
  }

  // Warnings for missing optional config
  for (const key of WARNINGS) {
    if (!process.env[key]) {
      logger.warn(`Optional env var not set: ${key} (email notifications will be disabled)`);
    }
  }

  if (!valid) {
    logger.error('Environment validation failed. Exiting.');
    process.exit(1);
  }

  logger.info(`Environment: ${env} | DB: ${process.env.DB_DIALECT || 'sqlite'} | Port: ${process.env.PORT || 3000}`);
}

module.exports = validateEnv;

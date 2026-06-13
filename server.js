require('dotenv').config();

const validateEnv = require('./src/config/validateEnv');
validateEnv();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const logger = require('./src/config/logger');
const { syncAndSeed } = require('./src/models');
const { startCronJobs } = require('./src/services/cronService');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// ── SECURITY ──
app.set('trust proxy', 1); // Trust reverse proxy (Nginx)

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'unpkg.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      mediaSrc: ["'self'", 'blob:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [process.env.FRONTEND_URL || 'http://localhost:3000'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      cb(null, true);
    } else {
      cb(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── RATE LIMITING ──
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
}));

app.use('/api/', rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── LOGGING ──
app.use(morgan(
  process.env.NODE_ENV === 'production'
    ? ':remote-addr :method :url :status :res[content-length] - :response-time ms'
    : 'dev',
  { stream: { write: (msg) => logger.http(msg.trim()) } }
));

// ── PARSING ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── API ROUTES ──
app.use('/api/auth',       require('./src/routes/auth'));
app.use('/api/assets',     require('./src/routes/assets'));
app.use('/api/employees',  require('./src/routes/employees'));
app.use('/api/contracts',  require('./src/routes/contracts'));
app.use('/api/dashboard',  require('./src/routes/dashboard'));
app.use('/api/audit-logs', require('./src/routes/auditLogs'));
app.use('/api/import',     require('./src/routes/import'));

// ── HEALTH CHECK ──
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
  });
});

// ── FRONTEND ──
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
}));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── ERROR HANDLER ──
app.use(errorHandler);

// ── GRACEFUL SHUTDOWN ──
const server = { instance: null };

const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  if (server.instance) {
    server.instance.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    // Force exit after 15s if not closed
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 15000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// ── START ──
const PORT = parseInt(process.env.PORT) || 3000;

syncAndSeed()
  .then(() => {
    server.instance = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`AIS Server listening on port ${PORT}`);
    });
    startCronJobs();
  })
  .catch((err) => {
    logger.error('Failed to start server:', err);
    process.exit(1);
  });

module.exports = app;

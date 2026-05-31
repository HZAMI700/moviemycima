const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const config = require('./config');
const logger = require('./utils/logger');
const cacheService = require('./services/cacheService');
const errorHandler = require('./middleware/errorHandler');
const { sanitizeInput } = require('./middleware/validate');
const { generalLimiter, apiLimiter } = require('./middleware/rateLimiter');

const app = express();

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInput);
app.use(generalLimiter);
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

let useMockData = false;

async function start() {
  try {
    await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 5000 });
    logger.info('MongoDB connected');
    app.use('/api', apiLimiter, require('./routes'));
  } catch (error) {
    logger.warn('MongoDB unavailable, using mock data mode');
    useMockData = true;
    app.use('/api', apiLimiter, require('./routes/mockRoutes'));
  }

  await cacheService.init();

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', mode: useMockData ? 'mock' : 'live', timestamp: new Date().toISOString() });
  });

  app.use(errorHandler);

  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} (mode: ${useMockData ? 'mock' : 'live'})`);
  });
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down...');
  await cacheService.disconnect();
  await mongoose.disconnect().catch(() => {});
  process.exit(0);
});

start();

module.exports = app;

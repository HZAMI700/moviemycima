require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/moviemycima',
  redisUri: process.env.REDIS_URI || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-me',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@moviemycima.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@123456',
  scrapingInterval: parseInt(process.env.SCRAPING_INTERVAL) || 30,
  scrapingSource: process.env.SCRAPING_SOURCE || '',
  proxyList: (process.env.PROXY_LIST || '').split(',').filter(Boolean),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

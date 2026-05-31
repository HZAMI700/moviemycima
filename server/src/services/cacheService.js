const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');

let redis;
let isConnected = false;

const init = async () => {
  try {
    redis = new Redis(config.redisUri, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      lazyConnect: true,
    });

    await redis.connect();
    isConnected = true;
    logger.info('Redis connected');
  } catch (error) {
    logger.warn('Redis connection failed, using memory cache fallback');
    isConnected = false;
  }
};

const memoryCache = new Map();
const memoryTTL = new Map();

const get = async (key) => {
  if (isConnected) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return memoryGet(key);
    }
  }
  return memoryGet(key);
};

const memoryGet = (key) => {
  const data = memoryCache.get(key);
  if (!data) return null;
  if (memoryTTL.get(key) < Date.now()) {
    memoryCache.delete(key);
    memoryTTL.delete(key);
    return null;
  }
  return data;
};

const set = async (key, value, ttlSeconds = 300) => {
  if (isConnected) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
      return;
    } catch {}
  }
  memoryCache.set(key, value);
  memoryTTL.set(key, Date.now() + ttlSeconds * 1000);
};

const del = async (key) => {
  if (isConnected) {
    try { await redis.del(key); } catch {}
  }
  memoryCache.delete(key);
  memoryTTL.delete(key);
};

const delByPattern = async (pattern) => {
  if (isConnected) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) await redis.del(...keys);
    } catch {}
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern.replace('*', ''))) {
      memoryCache.delete(key);
      memoryTTL.delete(key);
    }
  }
};

const flushAll = async () => {
  if (isConnected) {
    try { await redis.flushall(); } catch {}
  }
  memoryCache.clear();
  memoryTTL.clear();
};

const disconnect = async () => {
  if (isConnected) {
    try { await redis.quit(); } catch {}
  }
};

module.exports = { init, get, set, del, delByPattern, flushAll, disconnect };

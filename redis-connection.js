// Redis连接实例
const redis = require('redis');
const { redis: redisConfig } = require('./config');
const logger = require('./config/logger');

// 创建Redis客户端实例
const redisClient = redis.createClient({
  url: redisConfig.url,
  password: redisConfig.password,
  database: redisConfig.db,
  retryStrategy: redisConfig.retryStrategy,
  connectTimeout: redisConfig.connectTimeout,
  commandTimeout: redisConfig.commandTimeout,
  socket: {
    keepAlive: redisConfig.keepAlive,
    reconnectStrategy: redisConfig.retryStrategy
  }
});

// 监听Redis连接事件
redisClient.on('connect', () => {
  logger.debug('Redis连接中...');
});

redisClient.on('ready', () => {
  logger.info('Redis已准备就绪');
});

redisClient.on('error', (err) => {
  logger.error('Redis连接错误:', err);
});

redisClient.on('end', () => {
  logger.info('Redis连接已关闭');
});

// 连接Redis服务器
async function connectRedis() {
  try {
    await redisClient.connect();
    console.log('Redis连接成功');
    return redisClient;
  } catch (err) {
    logger.error('Redis连接失败:', err);
    throw err;
  }
}

// 关闭Redis连接
async function disconnectRedis() {
  try {
    await redisClient.quit();
    logger.info('Redis连接已优雅关闭');
  } catch (err) {
    logger.error('关闭Redis连接时出错:', err);
    // 尝试强制断开连接
    try {
      await redisClient.disconnect();
    } catch (disconnectErr) {
      logger.error('强制断开Redis连接时出错:', disconnectErr);
    }
  }
}

// 获取缓存值，带过期时间刷新功能
async function getWithRefresh(key, refreshTtl = null) {
  try {
    const value = await redisClient.get(key);
    if (value !== null && refreshTtl !== null) {
      // 如果提供了刷新时间且键存在，则刷新过期时间
      await redisClient.expire(key, refreshTtl);
    }
    return value !== null ? JSON.parse(value) : null;
  } catch (err) {
    logger.error(`获取Redis键${key}时出错:`, err);
    return null;
  }
}

// 设置缓存值
async function setWithTtl(key, value, ttl = null) {
  try {
    const jsonValue = JSON.stringify(value);
    if (ttl) {
      await redisClient.set(key, jsonValue, { EX: ttl });
    } else {
      await redisClient.set(key, jsonValue);
    }
    return true;
  } catch (err) {
    logger.error(`设置Redis键${key}时出错:`, err);
    return false;
  }
}

// 删除缓存
async function del(key) {
  try {
    await redisClient.del(key);
    return true;
  } catch (err) {
    logger.error(`删除Redis键${key}时出错:`, err);
    return false;
  }
}

// 导出Redis客户端和相关函数
module.exports = {
  redisClient,
  connectRedis,
  disconnectRedis,
  getWithRefresh,
  setWithTtl,
  del
};
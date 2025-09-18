import rateLimit from 'express-rate-limit';
import logger from '../config/logger.js';
import { appConfig } from '../config/index.js';

/**
 * API请求限流中间件
 * 限制客户端在指定时间内的请求次数，防止恶意请求和DoS攻击
 * @returns {Function} Express中间件函数
 */
const createRateLimiter = () => {
  // 从配置中获取限流参数，如果没有则使用默认值
  const limitConfig = {
    windowMs: appConfig.rateLimitWindowMs || 15 * 60 * 1000, // 15分钟
    max: appConfig.rateLimitMaxRequests || 100, // 每个IP每窗口最多100个请求
    message: {
      error: {
        code: 429,
        message: '请求过于频繁，请稍后再试',
        details: '您的请求超出了限制，请在稍后重试'
      }
    },
    standardHeaders: true, // 返回RateLimit-*响应头
    legacyHeaders: false,  // 禁用X-RateLimit-*响应头
    handler: (req, res, next, options) => {
      // 记录超出限制的请求
      logger.warn(`请求超出限制 - IP: ${options.key}, 路径: ${req.path}`);
      res.status(options.statusCode).send(options.message);
    }
    // 注意：在express-rate-limit 8.x版本中，onLimitReached已被弃用
    // 不需要自定义keyGenerator，默认会使用ipKeyGenerator正确处理IPv6地址
  };

  return rateLimit(limitConfig);
};

/**
 * 全局API限流中间件实例
 * 应用于所有API请求
 */
const apiRateLimiter = createRateLimiter();

export {
  createRateLimiter,
  apiRateLimiter
};
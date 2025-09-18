// 统一配置管理模块

// 加载环境变量
import dotenv from 'dotenv';
dotenv.config();

// 应用程序配置
export const appConfig = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  // 限流配置
  rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : null,
  rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) : null
};

// 数据库配置
export const database = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  dialect: process.env.DB_DIALECT,
  define: {
    timestamps: false, // 默认不添加createdAt和updatedAt字段
    underscored: true // 使用下划线命名法
  }
};

// Redis配置
export const redis = {
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB,
  retryMax: process.env.REDIS_RETRY_MAX,
  retryInterval: process.env.REDIS_RETRY_INTERVAL,
  connectTimeout: process.env.REDIS_CONNECT_TIMEOUT,
  commandTimeout: process.env.REDIS_COMMAND_TIMEOUT,
  keepAlive: process.env.REDIS_KEEP_ALIVE,
  retryStrategy: function(times) {
    // 重试策略：最多重试指定次数，每次间隔递增
    const maxRetries = parseInt(process.env.REDIS_RETRY_MAX) || 10;
    const baseInterval = parseInt(process.env.REDIS_RETRY_INTERVAL) || 100;
    
    if (times > maxRetries) {
      return new Error('Reached max connection retries');
    }
    
    const delay = Math.min(times * baseInterval, 2000);
    return delay;
  }
};

// JWT配置
export const jwt = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN,
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN
};

// 日志配置
export const logger = {
  level: process.env.LOG_LEVEL || 'info',
  dir: process.env.LOG_DIR || './logs',
  maxSize: process.env.LOG_MAX_SIZE || '20m',
  maxFiles: process.env.LOG_MAX_FILES || '14d',
  maxErrorFiles: process.env.LOG_MAX_ERROR_FILES || '30d',
  datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
  serviceName: 'note-stu'
};
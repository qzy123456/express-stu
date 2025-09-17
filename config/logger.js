const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('./index').logger;

// 定义JSON格式（用于文件输出）
const jsonFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.json()
);

// 定义控制台文本格式（保持彩色输出）
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.colorize(),
  winston.format.printf(info => {
    return `[${info.timestamp}] [${info.level}] ${info.message}`;
  })
);

// 创建普通日志传输（info 级别及以上）
const infoTransport = new DailyRotateFile({
  filename: 'data-%DATE%.log',
  datePattern: config.datePattern,
  zippedArchive: false,
  maxSize: config.maxSize,
  maxFiles: config.maxFiles, // 保留日志天数
  dirname: config.dir.startsWith('./') ? path.join(__dirname, '../', config.dir) : config.dir,
  level: 'info',
  format: jsonFormat
});

// 创建错误日志传输（error 级别及以上）
const errorTransport = new DailyRotateFile({
  filename: 'err-%DATE%.log',
  datePattern: config.datePattern,
  zippedArchive: false,
  maxSize: config.maxSize,
  maxFiles: config.maxErrorFiles, // 保留错误日志天数
  dirname: config.dir.startsWith('./') ? path.join(__dirname, '../', config.dir) : config.dir,
  level: 'error',
  format: jsonFormat
});

// 创建控制台传输
const consoleTransport = new winston.transports.Console({
  format: consoleFormat
});

// 创建 logger 实例
const logger = winston.createLogger({
  level: config.level,
  defaultMeta: {
    service: config.serviceName
  },
  transports: [
    infoTransport,
    errorTransport,
    consoleTransport
  ]
});

module.exports = logger;
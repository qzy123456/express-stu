import logger from '../config/logger.js';

/**
 * 全局错误处理中间件
 * 捕获所有未处理的异常，防止程序崩溃
 * @param {Error} err - 错误对象
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express的next函数
 */
const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  logger.error('未捕获的异常:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // 根据错误类型确定HTTP状态码
  let statusCode = 500;
  let errorMessage = '服务器内部错误';

  // 处理特定类型的错误
  if (err.name === 'SyntaxError') {
    statusCode = 400;
    errorMessage = '请求体语法错误';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorMessage = '未授权访问';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorMessage = '资源不存在';
  }

  // 向客户端发送错误响应
  res.status(statusCode).json({
    error: {
      code: statusCode,
      message: errorMessage,
      // 在开发环境中可以返回详细错误信息
      // 在生产环境中不应该暴露详细错误信息
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }
  });
};

/**
 * 404 中间件 - 处理未匹配到路由的请求
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express的next函数
 */
const notFoundHandler = (req, res, next) => {
  const err = new Error(`未找到路径: ${req.originalUrl}`);
  err.name = 'NotFoundError';
  err.status = 404;
  next(err);
};

/**
 * 全局未捕获异常处理器
 * 防止进程因为未处理的Promise拒绝或未捕获的异常而崩溃
 */
const setupGlobalErrorHandlers = () => {
  // 捕获未处理的Promise拒绝
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('未处理的Promise拒绝:', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined
    });
  });

  // 捕获未捕获的异常
  process.on('uncaughtException', (err) => {
    logger.error('未捕获的异常:', {
      message: err.message,
      stack: err.stack
    });
    // 注意：在某些严重错误情况下，可能需要重启进程
    // 但为了防止立即崩溃，我们可以选择继续运行
  });
};

export { 
  errorHandler,
  notFoundHandler,
  setupGlobalErrorHandlers
};
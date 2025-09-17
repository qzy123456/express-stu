// JWT中间件
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config');
const logger = require('../config/logger');

/**
 * 生成JWT Token
 * @param {Object} payload - 要包含在token中的数据
 * @param {number} expiresIn - 过期时间（秒），默认使用配置文件中的值
 * @returns {string} 生成的JWT Token
 */
const generateToken = (payload, expiresIn = jwtConfig.expiresIn) => {
  return jwt.sign(payload, jwtConfig.secret, { expiresIn });
};

/**
 * 生成刷新Token
 * @param {Object} payload - 要包含在refresh token中的数据
 * @returns {string} 生成的刷新Token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.refreshTokenExpiresIn });
};

/**
 * 验证JWT Token的中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express的next函数
 */
const verifyToken = (req, res, next) => {
  // 从请求头的Authorization字段获取token
  const authHeader = req.headers.authorization;
  
  // 如果没有提供token，返回401错误
  if (!authHeader) {
    return res.status(401).json({ message: '未提供认证token' });
  }
  
  // 提取token（格式通常是 'Bearer token'）
  const token = authHeader.split(' ')[1];
  
  // 如果token格式不正确，返回401错误
  if (!token) {
    return res.status(401).json({ message: 'token格式不正确' });
  }
  
  // 验证token
  jwt.verify(token, jwtConfig.secret, (err, user) => {
    if (err) {
      // 如果token无效或已过期，返回403错误
      logger.error('JWT验证失败: ' + err.message);
      return res.status(403).json({ message: '无效的token' });
    }
    
    // 记录成功的token验证
    logger.info('JWT验证成功: 用户ID - ' + user.id);
    
    // 将用户信息添加到请求对象中，方便后续路由使用
    req.user = user;
    next();
  });
};

/**
 * 验证刷新Token
 * @param {string} refreshToken - 要验证的刷新token
 * @returns {Object} 验证结果和解析后的数据
 */
const verifyRefreshToken = (refreshToken) => {
  return new Promise((resolve, reject) => {
    jwt.verify(refreshToken, jwtConfig.secret, (err, user) => {
      if (err) {
        logger.error('刷新Token验证失败: ' + err.message);
        reject(new Error('无效的刷新token'));
      } else {
        logger.info('刷新Token验证成功: 用户ID - ' + user.id);
        resolve(user);
      }
    });
  });
};

// 导出所有函数
module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken
};
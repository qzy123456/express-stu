// 用户相关路由
import express from 'express';
const router = express.Router();
import { body, validationResult } from 'express-validator';
import { getWithRefresh, setWithTtl } from '../redis-connection.js';
import { generateToken, verifyToken } from '../middleware/jwt.js';
import jwt from 'jsonwebtoken';
import { jwt as jwtConfig } from '../config/index.js';
import logger from '../config/logger.js';

// 创建用户路由
router.post('/user', [
  // 使用express-validator验证请求体中的字段
  body('email').isEmail().withMessage('无效邮箱格式'),
  body('password').isLength({ min: 6 }).withMessage('密码长度至少为6位'),
  body('age').isInt({ min: 18 }).withMessage('年龄需满18岁')
], async (req, res) => {
  logger.debug('用户创建请求体内容:', req.body);
  
  // 检查验证结果
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    // 解构请求体中的数据
    const { email, password, age, name, phone, avatar } = req.body;
    
    // 使用Sequelize创建用户
    const user = await req.app.locals.models.User.create({
      email,
      password,
      age,
      name: name || '未知',
      phone: phone || null,
      avatar: avatar || null
    });
    
    // 清除用户列表缓存，使其重新从数据库获取
    if (req.app.locals.redisClient) {
      try {
        await req.app.locals.redisClient.del('users:list');
        logger.info('用户列表缓存已清除');
      } catch (redisError) {
        logger.error('清除用户列表缓存失败:', redisError);
      }
    }
    
    res.json({
      success: true,
      message: '用户创建成功',
      data: user
    });
  } catch (error) {
    logger.error('创建用户时出错:', error);
    res.status(500).json({
      success: false,
      message: '创建用户失败',
      error: error.message
    });
  }
});

// 获取用户列表路由
router.get('/users', async (req, res) => {
  try {
    // 从Redis缓存获取用户列表
    let users = null;
    if (req.app.locals.redisClient) {
      try {
        users = await getWithRefresh('users:list', 10); // 刷新缓存10秒
        if (users) {
          logger.debug('从Redis缓存获取用户列表');
          return res.json({
            success: true,
            message: '成功获取用户列表',
            data: users,
            source: 'cache'
          });
        }
      } catch (redisError) {
          logger.error('从Redis获取缓存失败:', redisError);
          // Redis错误不应影响主流程
        }
    }
    
    // 从数据库获取用户列表
    users = await req.app.locals.models.User.findAll({
      attributes: ['id', 'name', 'email', 'age', 'phone', 'created_at']
    });
    
    // 将结果缓存到Redis
    if (req.app.locals.redisClient) {
      try {
          await setWithTtl('users:list', users, 10); // 缓存10秒
          logger.debug('用户列表已缓存到Redis');
        } catch (redisError) {
          logger.error('缓存用户列表失败:', redisError);
        }
    }
    
    res.json({
      success: true,
      message: '成功获取用户列表',
      data: users,
      count: users.length,
      source: 'database'
    });
  } catch (error) {
    logger.error('获取用户列表时出错:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
});

// 用户登录接口
router.post('/login', [
  body('email').isEmail().withMessage('无效邮箱格式'),
  body('password').notEmpty().withMessage('密码不能为空')
], async (req, res) => {
  // 检查验证结果
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { email, password } = req.body;
    
    // 查找用户
    const user = await req.app.locals.models.User.findOne({
      where: { email },
      // 明确指定要获取密码字段
      attributes: {
        include: ['password']
      }
    });
    
    // 检查用户是否存在以及密码是否正确
    if (!user || !(await user.validPassword(password))) {
      logger.warn('登录失败: 用户不存在或密码错误 - 邮箱: ' + email);
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }
    
    logger.info('用户登录成功: 用户ID - ' + user.id + ', 邮箱 - ' + email);
    
    // 生成JWT Token，包含用户ID和邮箱信息
    const token = generateToken({
      id: user.id,
      email: user.email
    });
    
    // 生成刷新Token
    const refreshToken = generateToken({
      id: user.id,
      email: user.email,
      type: 'refresh'
    }, 60 * 60 * 24 * 7); // 刷新Token有效期7天
    
    // 将用户对象中的密码字段移除，避免返回给客户端
    const userData = user.toJSON();
    
    res.json({
      success: true,
      message: '登录成功',
      data: userData,
      token,
      refreshToken
    });
  } catch (error) {
    logger.error('登录时出错:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
});

// 刷新Token接口
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      logger.warn('刷新Token失败: 未提供刷新token');
      return res.status(400).json({
        success: false,
        message: '未提供刷新token'
      });
    }
    
    // 验证刷新Token
    const decoded = jwt.verify(refreshToken, jwtConfig.secret);
    
    // 检查是否是刷新Token
    if (decoded.type !== 'refresh') {
      logger.warn('刷新Token失败: 无效的刷新token类型');
      return res.status(400).json({
        success: false,
        message: '无效的刷新token'
      });
    }
    
    logger.info('Token刷新成功: 用户ID - ' + decoded.id);
    
    // 生成新的访问Token
    const newToken = generateToken({
      id: decoded.id,
      email: decoded.email
    });
    
    res.json({
      success: true,
      message: 'Token刷新成功',
      token: newToken
    });
  } catch (error) {
    logger.error('刷新Token时出错:', error);
    res.status(401).json({
      success: false,
      message: '刷新Token失败',
      error: error.message
    });
  }
});

// 受保护的路由示例 - 获取当前登录用户信息
router.get('/profile', verifyToken, async (req, res) => {
  try {
    // 从请求对象中获取用户信息（由verifyToken中间件添加）
    const { id } = req.user;
    
    // 查询用户信息
    const user = await req.app.locals.models.User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'age', 'phone', 'avatar', 'created_at']
    });
    
    if (!user) {
      logger.warn('获取用户信息失败: 用户不存在 - 用户ID: ' + id);
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    logger.info('获取用户信息成功: 用户ID - ' + id);
    
    res.json({
      success: true,
      message: '获取用户信息成功',
      data: user
    });
  } catch (error) {
    logger.error('获取用户信息时出错:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
});

// 将获取用户列表的路由也添加JWT验证保护
router.get('/users', verifyToken, async (req, res) => {
  try {
    // 从Redis缓存获取用户列表
    let users = null;
    if (req.app.locals.redisClient) {
      try {
        users = await getWithRefresh('users:list', 10); // 刷新缓存10秒
        if (users) {
          console.log('从Redis缓存获取用户列表');
          return res.json({
            success: true,
            message: '成功获取用户列表',
            data: users,
            source: 'cache'
          });
        }
      } catch (redisError) {
        console.error('从Redis获取缓存失败:', redisError);
        // Redis错误不应影响主流程
      }
    }
    
    // 从数据库获取用户列表
    users = await req.app.locals.models.User.findAll({
      attributes: ['id', 'name', 'email', 'age', 'phone', 'created_at']
    });
    
    // 将结果缓存到Redis
    if (req.app.locals.redisClient) {
      try {
        await setWithTtl('users:list', users, 10); // 缓存10秒
        console.log('用户列表已缓存到Redis');
      } catch (redisError) {
        console.error('缓存用户列表失败:', redisError);
      }
    }
    
    res.json({
      success: true,
      message: '成功获取用户列表',
      data: users,
      count: users.length,
      source: 'database'
    });
  } catch (error) {
    console.error('获取用户列表时出错:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
});

export default router;
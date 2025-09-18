// Redis相关路由
import express from 'express';
const router = express.Router();

// 设置Redis值的路由
router.get('/set', async (req, res) => {
  try {
    const { key, value, expire } = req.query;
    
    // 检查参数是否齐全
    if (!key || !value) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: key 和 value'
      });
    }
    
    // 设置值
    await req.app.locals.redisClient.set(key, value);
    
    // 如果提供了过期时间，设置过期时间（单位：秒）
    if (expire) {
      await req.app.locals.redisClient.expire(key, parseInt(expire));
    }
    
    res.json({
      success: true,
      message: 'Redis 值设置成功',
      data: {
        key,
        value,
        expire: expire ? parseInt(expire) : null
      }
    });
  } catch (err) {
    console.error('设置 Redis 值时出错:', err);
    res.status(500).json({
      success: false,
      message: '设置 Redis 值失败',
      error: err.message
    });
  }
});

// 获取Redis值的路由
router.get('/get', async (req, res) => {
  try {
    const { key } = req.query;
    
    // 检查参数是否齐全
    if (!key) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: key'
      });
    }
    
    // 获取值
    const value = await req.app.locals.redisClient.get(key);
    
    if (value === null) {
      return res.json({
        success: true,
        message: '未找到该 key 对应的值',
        data: null
      });
    }
    
    res.json({
      success: true,
      message: 'Redis 值获取成功',
      data: {
        key,
        value
      }
    });
  } catch (err) {
    console.error('获取 Redis 值时出错:', err);
    res.status(500).json({
      success: false,
      message: '获取 Redis 值失败',
      error: err.message
    });
  }
});

export default router;
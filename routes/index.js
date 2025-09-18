// 路由入口文件
import express from 'express';
const router = express.Router();

// 导入各个路由模块
import homeRoutes from './home.js';
import redisRoutes from './redis.js';
import userRoutes from './users.js';
import productRoutes from './products.js';
import categoryRoutes from './categories.js';

// 注册路由
router.use('/', homeRoutes);
router.use('/redis', redisRoutes);
router.use('/', userRoutes);
router.use('/', productRoutes);
router.use('/', categoryRoutes);

export default router;
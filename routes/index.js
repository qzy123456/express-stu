// 路由入口文件
const express = require('express');
const router = express.Router();

// 导入各个路由模块
const homeRoutes = require('./home');
const redisRoutes = require('./redis');
const userRoutes = require('./users');
const productRoutes = require('./products');
const categoryRoutes = require('./categories');

// 注册路由
router.use('/', homeRoutes);
router.use('/redis', redisRoutes);
router.use('/', userRoutes);
router.use('/', productRoutes);
router.use('/', categoryRoutes);

module.exports = router;
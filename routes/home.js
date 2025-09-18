// 首页路由
import express from 'express';
const router = express.Router();
import Response from '../utils/response-formatter.js';

// 首页路由
router.get('/', (req, res) => {
  Response.success(res, {
    message: 'Hello World!',
    serverTime: new Date().toISOString(),
    version: '1.0.0'
  }, '欢迎访问API');
});

// 测试错误处理的路由 - 故意抛出一个同步错误
router.get('/test-error', (req, res) => {
  throw new Error('这是一个测试错误');
});

// 测试Promise拒绝的路由 - 故意返回一个被拒绝的Promise
router.get('/test-promise-reject', (req, res) => {
  // 这是一个不会被捕获的Promise拒绝，应该被全局错误处理器捕获
  new Promise((resolve, reject) => {
    reject(new Error('这是一个测试Promise拒绝'));
  });
  
  Response.success(res, null, 'Promise拒绝已触发，请查看日志');
});

export default router;
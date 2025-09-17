const express = require('express');

// 导入配置和日志模块
const { appConfig } = require('./config');
const logger = require('./config/logger');

// 导入Sequelize相关模块
const { sequelize, testConnection, syncModels } = require('./db-connection');
const { User, Product, Category } = require('./models');

// 导入Redis连接模块
const { redisClient, connectRedis, disconnectRedis } = require('./redis-connection');

// 导入路由模块
const routes = require('./routes');

// 创建express应用实例
const app = express();
const port = appConfig.port;

// 配置中间件以解析JSON请求体
app.use(express.json());

// 将redisClient和sequelize模型挂载到app实例上，方便后续路由使用
app.locals.redisClient = redisClient;
app.locals.models = {
  User,
  Product,
  Category
};

// 错误处理中间件中添加 Redis 和数据库关闭逻辑
process.on('SIGINT', () => {
  // 先关闭Redis连接
  disconnectRedis().then(() => {
    logger.info('Redis连接已关闭');
    // 再关闭数据库连接
    return sequelize.close();
  }).then(() => {
    logger.info('数据库连接已关闭');
    process.exit(0);
  }).catch(err => {
    logger.error('关闭连接时出错:', err);
    process.exit(1);
  });
});

// 使用路由模块
app.use('/', routes);

// 主函数：连接数据库和启动服务器
async function startApp() {
  try {
    // 连接Redis
    await connectRedis();
    logger.info('Redis连接成功');
    
    // 连接数据库
    await testConnection();
    // 同步数据库模型
    await syncModels();
    
    // 启动服务器
    app.listen(port, () => {
      logger.info(`Example app listening at http://localhost:${port}`);
    });
  } catch (err) {
    logger.error('启动失败:', err);
    process.exit(1); // 如果启动失败，退出应用
  }
}

// 启动应用
startApp();
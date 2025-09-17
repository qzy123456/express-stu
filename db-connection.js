// Sequelize连接实例
const { Sequelize } = require('sequelize');
const { database } = require('./config');
const logger = require('./config/logger');

// 创建Sequelize实例
const sequelize = new Sequelize(
  database.database,
  database.username,
  database.password,
  {
    host: database.host,
    dialect: database.dialect,
    port: database.port,
    define: database.define,
    logging: false // 关闭SQL日志输出，生产环境建议关闭
  }
);

// 测试数据库连接
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('数据库连接成功!');
  } catch (error) {
    logger.error('无法连接到数据库:', error);
    // 如果连接失败，应用程序可以决定是否继续运行
  }
}

// 同步数据库模型（仅在开发环境使用）
async function syncModels() {
  try {
    // force: false 表示不会删除已存在的表
    await sequelize.sync({ force: false });
    logger.info('数据库模型已同步!');
  } catch (error) {
    logger.error('同步数据库模型失败:', error);
  }
}

// 导出Sequelize实例和相关函数
module.exports = {
  sequelize,
  Sequelize,
  testConnection,
  syncModels
};
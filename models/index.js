// 模型索引文件 - 统一导出所有模型
const User = require('./user');
const Product = require('./product');
const Category = require('./category');

// 导出所有模型
exports.User = User;
exports.Product = Product;
exports.Category = Category;

// 导出Sequelize连接
exports.sequelize = require('../db-connection').sequelize;

// 初始化所有模型的关联关系
exports.initAssociations = function() {
  // 这里可以定义模型之间的关联关系
  // 例如: Product.belongsTo(Category, { foreignKey: 'category_id' });
  // 这些关联关系已经在各自的模型文件中定义
  console.log('所有模型关联已初始化');
};
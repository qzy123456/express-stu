// 模型索引文件 - 统一导出所有模型
import User from './user.js';
import Product from './product.js';
import Category from './category.js';

// 导出所有模型
export { User, Product, Category };

// 导出Sequelize连接
import { sequelize } from '../db-connection.js';
export { sequelize };

// 初始化所有模型的关联关系
export function initAssociations() {
  // 这里可以定义模型之间的关联关系
  // 例如: Product.belongsTo(Category, { foreignKey: 'category_id' });
  // 这些关联关系已经在各自的模型文件中定义
  console.log('所有模型关联已初始化');
};
// Category模型定义
import { DataTypes } from 'sequelize';
import { sequelize } from '../db-connection.js';

const Category = sequelize.define('Category', {
  // 定义模型属性
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '分类名称'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '分类描述'
  },
  parent_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories', // 自引用关联
      key: 'id'
    },
    comment: '父分类ID'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  // 模型配置
  tableName: 'categories', // 数据库表名
  timestamps: true, // 自动添加时间戳字段
  createdAt: 'created_at', // 自定义创建时间字段名
  updatedAt: 'updated_at' // 自定义更新时间字段名
});

// 定义自引用关联
Category.hasMany(Category, {
  foreignKey: 'parent_id',
  as: 'children'
});

Category.belongsTo(Category, {
  foreignKey: 'parent_id',
  as: 'parent'
});

export default Category;
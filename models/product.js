// Product模型定义
const { DataTypes } = require('sequelize');
const { sequelize } = require('../db-connection');
const Category = require('./category');

const Product = sequelize.define('Product', {
  // 定义模型属性
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '产品名称'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    },
    comment: '产品价格'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '产品描述'
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '产品库存'
  },
  category_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'categories', // 关联的表名
      key: 'id'
    },
    comment: '分类ID'
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
  tableName: 'products', // 数据库表名
  timestamps: true, // 自动添加时间戳字段
  createdAt: 'created_at', // 自定义创建时间字段名
  updatedAt: 'updated_at' // 自定义更新时间字段名
});

// 定义模型关联
Product.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category'
});

module.exports = Product;
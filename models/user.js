// User模型定义
const { DataTypes } = require('sequelize');
const { sequelize } = require('../db-connection');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  // 定义模型属性
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '用户姓名'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    },
    comment: '用户邮箱'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '用户密码（加密存储）',
    // 不将密码字段包含在JSON序列化中
    get() {
      return undefined;
    }
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    },
    comment: '用户年龄'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '用户电话'
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '用户头像'
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
  tableName: 'users', // 数据库表名
  timestamps: true, // 自动添加时间戳字段
  createdAt: 'created_at', // 自定义创建时间字段名
  updatedAt: 'updated_at' // 自定义更新时间字段名
});

// 添加模型关联（如果有其他模型）
// User.hasMany(OtherModel, { foreignKey: 'user_id' });

// 在创建或更新用户前，加密密码
User.beforeCreate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

// 添加验证密码的实例方法
User.prototype.validPassword = async function(password) {
  return await bcrypt.compare(password, this.getDataValue('password'));
};

module.exports = User;
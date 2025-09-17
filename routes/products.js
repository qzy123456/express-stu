// 产品相关路由
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { setWithTtl } = require('../redis-connection');

// 创建产品路由
router.post('/product/create', [
  // 使用express-validator验证请求体中的字段
  body('name').notEmpty().withMessage('产品名称不能为空'),
  body('price').isFloat({ min: 0 }).withMessage('价格必须为非负数'),
  body('stock').isInt({ min: 0 }).withMessage('库存必须为非负整数'),
  body('category_id').isInt().withMessage('分类ID必须为整数')
], async (req, res) => {
  console.log('创建产品请求体内容:', req.body);
  
  // 检查验证结果
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    // 解构请求体中的数据
    const { name, price, description, stock, category_id } = req.body;
    
    // 检查分类是否存在
    const category = await req.app.locals.models.Category.findByPk(category_id);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: '指定的分类不存在'
      });
    }
    
    // 使用Sequelize创建产品
    const product = await req.app.locals.models.Product.create({
      name,
      price,
      description: description || null,
      stock,
      category_id
    });
    
    // 清除产品列表缓存，使其重新从数据库获取
    if (req.app.locals.redisClient) {
      try {
        await req.app.locals.redisClient.del('products:list');
        console.log('产品列表缓存已清除');
      } catch (redisError) {
        console.error('清除产品列表缓存失败:', redisError);
      }
    }
    
    // 将产品信息缓存到Redis
    if (req.app.locals.redisClient) {
      try {
        await setWithTtl(`product:${product.id}`, product, 60); // 缓存1分钟
        console.log('产品信息已缓存到Redis');
      } catch (redisError) {
        console.error('缓存产品信息失败:', redisError);
      }
    }
    
    res.json({
      success: true,
      message: '产品创建成功',
      data: product
    });
  } catch (error) {
    console.error('创建产品时出错:', error);
    res.status(500).json({
      success: false,
      message: '创建产品失败',
      error: error.message
    });
  }
});

// 获取产品列表路由
router.get('/products', async (req, res) => {
  try {
    // 从Redis缓存获取产品列表
    let products = null;
    if (req.app.locals.redisClient) {
      try {
        products = await req.app.locals.redisClient.get('products:list');
        if (products) {
          products = JSON.parse(products);
          console.log('从Redis缓存获取产品列表');
          return res.json({
            success: true,
            message: '成功获取产品列表',
            data: products,
            source: 'cache'
          });
        }
      } catch (redisError) {
        console.error('从Redis获取缓存失败:', redisError);
        // Redis错误不应影响主流程
      }
    }
    
    // 从数据库获取产品列表，关联查询分类信息
    products = await req.app.locals.models.Product.findAll({
      include: [
        {
          model: req.app.locals.models.Category,
          as: 'category',
          attributes: ['id', 'name', 'description']
        }
      ],
      attributes: ['id', 'name', 'price', 'description', 'stock', 'created_at']
    });
    
    // 将结果缓存到Redis
    if (req.app.locals.redisClient) {
      try {
        await setWithTtl('products:list', products, 10); // 缓存10秒
        console.log('产品列表已缓存到Redis');
      } catch (redisError) {
        console.error('缓存产品列表失败:', redisError);
      }
    }
    
    res.json({
      success: true,
      message: '成功获取产品列表',
      data: products,
      count: products.length,
      source: 'database'
    });
  } catch (error) {
    console.error('获取产品列表时出错:', error);
    res.status(500).json({
      success: false,
      message: '获取产品列表失败',
      error: error.message
    });
  }
});

module.exports = router;
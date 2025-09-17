// 分类相关路由
const express = require('express');
const router = express.Router();

// 获取分类列表路由
router.get('/categories', async (req, res) => {
  try {
    // 从数据库获取分类列表
    const categories = await req.app.locals.models.Category.findAll({
      attributes: ['id', 'name', 'description', 'parent_id', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    
    // 如果需要，可以添加分类的树形结构构建逻辑
    const buildCategoryTree = (categories, parentId = null) => {
      const categoryTree = [];
      categories.forEach(category => {
        if (category.parent_id === parentId) {
          const children = buildCategoryTree(categories, category.id);
          if (children.length > 0) {
            category.children = children;
          }
          categoryTree.push(category);
        }
      });
      return categoryTree;
    };
    
    // 构建树形结构分类数据
    const categoryTree = buildCategoryTree(categories);
    
    res.json({
      success: true,
      message: '成功获取分类列表',
      data: {
        list: categories,
        tree: categoryTree
      },
      count: categories.length
    });
  } catch (error) {
    console.error('获取分类列表时出错:', error);
    res.status(500).json({
      success: false,
      message: '获取分类列表失败',
      error: error.message
    });
  }
});

module.exports = router;
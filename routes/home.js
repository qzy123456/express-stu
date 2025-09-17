// 首页路由
const express = require('express');
const router = express.Router();

// 首页路由
router.get('/', (req, res) => {
  res.send('Hello World!');
});

module.exports = router;
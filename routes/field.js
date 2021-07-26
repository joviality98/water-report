const express = require('express');
const router = express.Router();
const service = require('../services/fieldService');

// 通过日期查询
router.get('/nameList', service.queryAll);
// 添加字段别名
router.post('/addName', service.addName);
// 修改字段别名
router.post('/editName', service.editName);
// 删除字段别名
router.post('/deleteName', service.deleteName);
// 批量处理
router.post('/batchDeal',service.batchDeal);


module.exports = router;

const express = require('express');
const router = express.Router();
const service = require('../services/blowerService');

// 通过日期查询
router.get('/searchBlowerByDate', service.searchByDate);

module.exports = router;
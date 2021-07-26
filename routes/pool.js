
const express = require('express');
const router = express.Router();
const service = require('../services/poolService');

// 通过日期查询
router.get('/searchPoolByDate', service.searchByDate);

module.exports = router;
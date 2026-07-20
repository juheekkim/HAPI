'use strict';

const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const isAuthenticated = require('../middlewares/isAuthenticated');

// 모든 /chatbot 라우트에 인증 일괄 적용 (admin.js와 동일 패턴)
router.use(isAuthenticated);

router.get('/history', chatbotController.getHistory);
router.post('/message', chatbotController.sendMessage);
router.post('/clear', chatbotController.clearHistory);

module.exports = router;

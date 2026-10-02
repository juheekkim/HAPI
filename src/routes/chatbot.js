'use strict';

const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const isAuthenticated = require('../middlewares/isAuthenticated');
const requireAssistantAccess = require('../middlewares/requireAssistantAccess');

// 모든 /chatbot 라우트에 인증 + AI 기능 권한("AI 어시스턴트" 메뉴 매핑) 일괄 적용 (admin.js와 동일 패턴)
router.use(isAuthenticated, requireAssistantAccess);

router.get('/history', chatbotController.getHistory);
router.post('/message', chatbotController.sendMessage);
router.post('/clear', chatbotController.clearHistory);

module.exports = router;

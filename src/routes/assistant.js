'use strict';

const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const isAuthenticated = require('../middlewares/isAuthenticated');
const requireAssistantAccess = require('../middlewares/requireAssistantAccess');

// 역할에 "AI 어시스턴트" 메뉴가 매핑된 사용자만 접근(메뉴 숨김 + URL 직접 접근 차단)
router.use(isAuthenticated, requireAssistantAccess);

router.get('/', assistantController.index);

module.exports = router;

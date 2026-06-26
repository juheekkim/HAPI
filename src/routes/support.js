'use strict';

const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const isAuthenticated = require('../middlewares/isAuthenticated');

router.use(isAuthenticated);

router.get('/', supportController.index);
router.get('/inquiry', supportController.inquiryPage);
router.post('/inquiry', supportController.submitInquiry);
router.get('/firewall-apply', supportController.firewallApplyPage);
router.post('/firewall-apply', supportController.submitFirewallApply);

module.exports = router;

'use strict';

const express = require('express');
const multer = require('multer');
const router = express.Router();
const adminController = require('../controllers/adminController');
const isAuthenticated = require('../middlewares/isAuthenticated');
const isAdmin = require('../middlewares/isAdmin');

// API 등록 자동입력(엑셀/이미지 업로드)용 메모리 저장 - 10MB 제한
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// 모든 /admin 라우트에 인증+권한 일괄 적용
router.use(isAuthenticated, isAdmin);

router.get('/', adminController.index);
router.get('/partners', adminController.partners);
router.post('/partners/:id/approve', adminController.approvePartner);
router.post('/partners/:id/reject', adminController.rejectPartner);
router.get('/firewall', adminController.firewall);
router.post('/firewall/:id/approve', adminController.approveFirewall);
router.post('/firewall/:id/reject', adminController.rejectFirewall);
router.post('/firewall/:id/issue-token', adminController.issueToken);
router.get('/inquiries', adminController.inquiries);
router.post('/inquiries', adminController.createInquiry);
router.post('/inquiries/:id/answer', adminController.answerInquiry);
router.post('/inquiries/:id/toggle-faq', adminController.toggleFaq);
router.get('/notices', adminController.notices);
router.post('/notices', adminController.createNotice);
router.post('/notices/:id/update', adminController.updateNotice);
router.post('/notices/:id/delete', adminController.deleteNotice);
router.post('/notices/:id/toggle-visible', adminController.toggleNoticeVisible);
router.get('/apis', adminController.apis);
router.get('/apis/new', adminController.newApiForm);
router.get('/apis/:id/edit', adminController.editApiForm);
router.post('/apis', adminController.createApi);
router.post('/apis/:id/update', adminController.updateApi);
router.post('/apis/:id/delete', adminController.deleteApi);
router.post('/apis/import/excel', upload.single('file'), adminController.importApisFromExcel);
router.post('/apis/import/image', upload.array('files', 10), adminController.importApisFromImage);
router.post('/apis/import/mci', adminController.fetchApiFromMci);
router.get('/menus', adminController.menus);
router.post('/menus', adminController.createMenu);
router.post('/menus/:id/update', adminController.updateMenu);
router.post('/menus/:id/delete', adminController.deleteMenu);
router.post('/menus/:id/toggle-active', adminController.toggleMenuActive);
router.get('/roles', adminController.roles);
router.post('/roles', adminController.createRole);
router.post('/roles/:id/update', adminController.updateRole);
router.post('/roles/:id/delete', adminController.deleteRole);
router.post('/roles/:id/menus', adminController.assignMenus);
router.get('/partner-roles', adminController.partnerRoles);
router.post('/partner-roles/:id/update', adminController.updatePartnerRole);

module.exports = router;

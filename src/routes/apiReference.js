'use strict';

const express = require('express');
const router = express.Router();
const apiReferenceController = require('../controllers/apiReferenceController');
const isAuthenticated = require('../middlewares/isAuthenticated');

router.use(isAuthenticated);

router.get('/', apiReferenceController.index);
router.post('/try', apiReferenceController.tryEndpoint);
router.get('/my-source-ip', apiReferenceController.mySourceIp);

module.exports = router;

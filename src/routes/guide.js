'use strict';

const express = require('express');
const router = express.Router();
const guideController = require('../controllers/guideController');
const isAuthenticated = require('../middlewares/isAuthenticated');

router.use(isAuthenticated);

router.get('/', guideController.index);

module.exports = router;

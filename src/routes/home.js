'use strict';

const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const isAuthenticated = require('../middlewares/isAuthenticated');

router.use(isAuthenticated);

router.get('/', homeController.index);

module.exports = router;

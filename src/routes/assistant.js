'use strict';

const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const isAuthenticated = require('../middlewares/isAuthenticated');

router.use(isAuthenticated);

router.get('/', assistantController.index);

module.exports = router;

'use strict';

const express = require('express'),
      path = require('path');

const authController = require(path.resolve('./controllers/auth')),
      validators = require(path.resolve('./validators'));

const router = express.Router();

router.route('/token')
  .get(validators.auth.getToken, authController.getToken);

/*
router.route('/token/admin')
  .get(validators.auth.getToken, authController.getAdminToken);
*/

module.exports = router;

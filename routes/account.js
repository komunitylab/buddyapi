'use strict';

const express = require('express'),
      path = require('path');

const controllers = require(path.resolve('./controllers'));
const validators = require(path.resolve('./validators'));

const router = express.Router();

/**
 * Create a new user
 */
router.route('/')
  .patch(validators.account.verifyEmail, controllers.account.verifyEmail);

module.exports = router;

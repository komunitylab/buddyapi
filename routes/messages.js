'use strict';

const express = require('express'),
      path = require('path');

const controllers = require(path.resolve('./controllers')),
      validators = require(path.resolve('./validators'));

const router = express.Router();

router.route('/')
  .post(controllers.authorize.onlyActiveBuddyOrComer, controllers.sanitize.html(['body']), validators.messages.post, controllers.messages.post);

module.exports = router;

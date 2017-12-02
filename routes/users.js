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
  .post(validators.users.post, controllers.users.post);

router.route('/:username')
  // set buddy to active or inactive
  .patch(controllers.authorize.onlyAdmin, validators.users.patchActive, controllers.users.patchActive);

router.route('/:username/languages')
  .post(controllers.authorize.onlyLoggedMe, validators.userLanguages.post, controllers.userLanguages.post);

module.exports = router;

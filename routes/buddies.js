'use strict';

const express = require('express'),
      path = require('path');

const controllers = require(path.resolve('./controllers'));

const router = express.Router();


router.route('/')
  .get(controllers.authorize.onlyComer, controllers.users.get('buddy'));

module.exports = router;

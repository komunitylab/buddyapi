'use strict';

const express = require('express'),
      path = require('path');

const controllers = require(path.resolve('./controllers'));

const router = express.Router();

router.route('/')
  .post(controllers.messages.post);

module.exports = router;

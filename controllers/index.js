'use strict';

const account = require('./account'),
      auth = require('./auth'),
      authorize = require('./authorize'),
      go = require('./go'),
      messages = require('./messages'),
      userLanguages = require('./user-languages'),
      users = require('./users');

module.exports = { account, auth, authorize, go, messages, userLanguages, users };

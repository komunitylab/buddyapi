'use strict';

const { user: { username }, message: { body } } = require('./paths');

const post = {
  properties: {
    body: {
      properties: {
        receiver: username,
        body
      },
      required: ['receiver', 'body'],
      additionalProperties: false
    }
  }
};

module.exports = { post };

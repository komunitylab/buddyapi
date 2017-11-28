'use strict';

const { account: { code }, user: { username } } = require('./paths');

const verifyEmail = {
  properties: {
    body: {
      properties: {
        id: username,
        emailVerificationCode: code
      },
      required: ['id', 'emailVerificationCode'],
      additionalProperties: false
    }
  }
};

module.exports = { verifyEmail };

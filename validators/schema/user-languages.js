'use strict';

const { user: { username }, language: { code2, level } } = require('./paths');

const post = {
  properties: {
    body: {
      properties: {
        language: code2,
        level
      },
      required: ['language', 'level'],
      additionalProperties: false
    },
    params: {
      properties: {
        username
      },
      required: ['username'],
      additionalProperties: false
    }
  }
};

module.exports = { post };

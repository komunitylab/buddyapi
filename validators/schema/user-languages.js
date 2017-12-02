'use strict';

const { user: { username }, language: { code2, level } } = require('./paths');

const del = {
  properties: {
    params: {
      properties: {
        username,
        language: code2
      },
      required: ['username', 'language'],
      additionalProperties: false
    }
  }
};

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

module.exports = { del, post };

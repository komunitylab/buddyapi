'use strict';

const validate = require('./validate');

const del = validate('userLanguages/del'),
      post = validate('userLanguages/post');

module.exports = { del, post };

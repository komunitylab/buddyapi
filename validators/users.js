'use strict';

const validate = require('./validate');

const post = validate('users/post');

module.exports = { post };

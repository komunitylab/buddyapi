'use strict';

const validate = require('./validate');

const verifyEmail = validate('account/verifyEmail');

module.exports = { verifyEmail };

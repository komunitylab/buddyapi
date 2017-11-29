'use strict';

const validate = require('./validate');

const getToken = validate('auth/getToken');

module.exports = { getToken };

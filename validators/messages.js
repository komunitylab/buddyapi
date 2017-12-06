'use strict';

const validate = require('./validate');

const post = validate('messages/post', [['auth.username', 'body.receiver', (a, b) => a !== b]]);

module.exports = { post };

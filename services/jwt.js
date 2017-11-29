'use strict';

const jwt = require('jsonwebtoken'),
      path = require('path'),
      { promisify } = require('util');

const config = require(path.resolve('./config'));

/**
 * Provided user, response with jwt token
 */
async function generate(user) {
  const verified = Boolean(user.email);
  const { username } = user;

  const payload = { username, verified };

  return await (promisify(jwt.sign))(payload, config.jwt.secret, { algorithm: 'HS256', expiresIn: config.jwt.expirationTime });

}

/**
 * provide Bearer header + jwt token, return authentication data or throw error
 */
/* TODO
async function authenticate(/token) {

}
*/

module.exports = { generate/* , authenticate*/ };

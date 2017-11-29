'use strict';

const jwt = require('jsonwebtoken'),
      path = require('path'),
      { promisify } = require('util');

const config = require(path.resolve('./config'));

/**
 * Provided user, response with jwt token
 */
async function generate(user, isAdmin = false) {
  const verified = Boolean(user.email);
  const { username } = user;

  const payload = { username, verified };

  if (isAdmin === true) {
    payload.admin = true;
  }

  const expiresIn = (isAdmin) ? config.jwt.adminExpirationTime : config.jwt.expirationTime;

  return await (promisify(jwt.sign))(payload, config.jwt.secret, { algorithm: 'HS256', expiresIn });

}

/**
 * provide Bearer header + jwt token, return authentication data or throw error
 */
/* TODO
async function authenticate(/token) {

}
*/

module.exports = { generate/* , authenticate*/ };

'use strict';

const jwt = require('jsonwebtoken'),
      path = require('path');

const config = require(path.resolve('./config'));

/*
 * TODO there is a confusion whether jsonwebtoken is or will be asynchronous.
 * Currently jwt library is synchronous and callbacks may be deprecated in future.
 */

/**
 * Provided user, response with jwt token
 */
function generate(user, isAdmin = false) {
  const verified = Boolean(user.email);
  const { username, role, active } = user;

  const payload = { username, verified, role };

  if (role === 'buddy') {
    payload.active = !!active;
  }

  if (isAdmin === true) {
    payload.admin = true;
  }

  const expiresIn = (isAdmin) ? config.jwt.adminExpirationTime : config.jwt.expirationTime;

  return jwt.sign(payload, config.jwt.secret, { algorithm: 'HS256', expiresIn });

}

/**
 * provide Bearer header + jwt token, return authentication data or throw error
 */
function authenticate(authHeader) {
  const [type, token] = authHeader.split(' ');
  if (type !== 'Bearer') {
    throw new Error('invalid authorization method');
  }

  return jwt.verify(token, config.jwt.secret);
}

module.exports = { generate, authenticate };

'use strict';

const _ = require('lodash'),
      path = require('path');

const jwtService = require(path.resolve('./services/jwt'));

const pathBlacklist = ['/auth/token', '/auth/token/', '/auth/token/admin', '/auth/token/admin'];

/**
 * Set req.auth to login data based on jwt token from Authorization header
 */
async function setAuthData(req, res, next) {
  if (pathBlacklist.includes(req.path)) {
    return next();
  }

  req.auth = {
    logged: false,
    admin: false,
    username: null,
    role: null
  };

  if (_.has(req, 'headers.authorization')) {
    const authHeader = req.headers.authorization;

    try {
      const { verified, username, admin } = await jwtService.authenticate(authHeader);
      req.auth.logged = (verified === true) ? true : false;
      req.auth.username = username;
      req.auth.admin = (admin === true) ? true : false;
    } catch (e) {
      const error = { title: 'Not Authorized' };

      return res.status(403).json({ errors: [error] });
    }
  }

  return next();
}

module.exports = setAuthData;

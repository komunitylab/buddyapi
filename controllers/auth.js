'use strict';

const auth = require('basic-auth'),
      path = require('path');

const jwtService = require(path.resolve('./services/jwt')),
      accountService = require(path.resolve('./services/account')),
      model = require(path.resolve('./model'));

async function getToken(req, res, next) {
  try {
    // get username and password from Basic authorization header
    const credentials = auth(req);

    const token = await generateToken(credentials);

    return res.status(200).json({ meta: { token } });
  } catch (e) {
    // process various errors
    try {
      return res.status(401).json(generateErrorResponse(e));
    } catch (e) {
      return next(e);
    }
  }
}

async function getAdminToken(req, res, next) {
  try {
    // get username and password from Basic authorization header
    const credentials = auth(req);

    const token = await generateToken(credentials, true);

    return res.status(200).json({ meta: { token } });
  } catch (e) {
    // process various errors
    try {
      return res.status(401).json(generateErrorResponse(e));
    } catch (e) {
      return next(e);
    }
  }
}

/**
 * reusable code for getToken and getAdminToken: generate token
 * returns token or throws an error
 */
async function generateToken(credentials, admin = false) {
  // header might be missing or invalid, then auth() returns undefined
  if (!credentials) {
    throw new Error('invalid header');
  }

  const { name: username, pass: password } = credentials;

  // read basic user info and password hash info
  const user = await model.users.read(username, ['username', 'email', 'passwordHash', 'passwordSalt', 'passwordIterations', 'admin', 'role', 'active']);

  // compare given password and hashed password from database
  const {
    passwordHash: hash,
    passwordSalt: salt,
    passwordIterations: iterations
  } = user;
  const isAuthenticated = await accountService.compare(password, { hash, salt, iterations });
  // fail when password is wrong
  if (!isAuthenticated) {
    throw new Error('wrong password');
  }

  // fail when we request admin, but user is not admin
  if (admin && !user.admin) {
    throw new Error('not admin');
  }

  const isVerified = !!user.email;

  if (admin && !isVerified) {
    throw new Error('not verified admin');
  }

  // generate token
  return jwtService.generate(user, admin);
}

function generateErrorResponse(err) {
  const detail = (function (message) {
    switch (message) {
      case 'wrong password':
        return 'invalid credentials';
      case 'user not found':
        return 'invalid credentials';
      case 'invalid header':
        return 'invalid or missing Authorization header';
      case 'not verified admin':
        return 'email not verified';
      case 'not admin':
        return 'not admin';
      default:
        throw err;
    }
  }(err.message));

  return { errors: [{ title: 'Not Authorized', detail }] };
}

module.exports = { getToken, getAdminToken };

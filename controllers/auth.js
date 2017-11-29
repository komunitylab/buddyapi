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

    // header might be missing or invalid, then auth() returns undefined
    if (!credentials) {
      throw new Error('invalid header');
    }

    const { name: username, pass: password } = credentials;

    // read basic user info and password hash info
    const user = await model.users.read(username, ['username', 'email', 'passwordHash', 'passwordSalt', 'passwordIterations']);

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

    // generate token
    const token = await jwtService.generate(user);

    return res.status(200).json({ meta: { token } });
  } catch (e) {
    // process various errors
    let detail;
    switch (e.message) {
      case 'wrong password':
        detail = 'invalid credentials';
        break;
      case 'user not found':
        detail = 'invalid credentials';
        break;
      case 'invalid header':
        detail = 'invalid or missing Authorization header';
        break;
      default:
        return next(e);
    }
    return res.status(401).json({
      errors: [
        {
          title: 'Not Authorized',
          detail
        }
      ]
    });
  }
}

module.exports = { getToken };

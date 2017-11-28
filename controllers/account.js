'use strict';

const path = require('path');

const model = require(path.resolve('./model'));

async function verifyEmail(req, res, next) {
  try {
    const { id: username, emailVerificationCode: code } = req.body;

    await model.users.verifyEmail(username, code);

    return res.status(200).end();
  } catch (e) {

    switch (e.message) {
      case 'wrong code':
        return next([{ param: 'code', msg: 'code is wrong' }]);
      case 'expired code':
        return next([{ param: 'code', msg: 'code is expired' }]);
      case 'email already verified':
        return next([{ param: 'request', msg: 'email is already verified' }]);
    }
    return next(e);
  }
}

module.exports = { verifyEmail };

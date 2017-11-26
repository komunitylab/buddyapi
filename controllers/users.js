'use strict';

const path = require('path');

const model = require(path.resolve('./model')),
      mailer = require(path.resolve('./services/mailer'));

async function create(req, res, next) {
  try {
    // returns email verification code
    const code = await model.users.create(req.body);

    const { email } = req.body;

    await mailer.verifyEmail({ email, code });

    return res.status(201).json({});
  } catch (e) {
    return next(e);
  }
}

module.exports = { create };

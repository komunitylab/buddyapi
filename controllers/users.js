'use strict';

const path = require('path');

const model = require(path.resolve('./model')),
      mailer = require(path.resolve('./services/mailer'));

async function post(req, res, next) {
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

/**
 * update buddy to active: boolean
 */
async function patchActive(req, res, next) {
  try {
    // get request data
    const { id: username, active } = req.body;
    // update in database
    await model.users.updateActive(username, active);
    // respond
    return res.status(200).json();
  } catch (e) {
    // error responses
    switch (e.message) {
      case 'not found':
        return res.status(404).json();
      default:
        return next(e);
    }
  }
}

module.exports = { patchActive, post };

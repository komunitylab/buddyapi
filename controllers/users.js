'use strict';

const _ = require('lodash'),
      path = require('path');

const model = require(path.resolve('./model')),
      mailer = require(path.resolve('./services/mailer')),
      format = require(path.resolve('./services/format')),
      userSerializer = require(path.resolve('./serializers/users'));

function get(role) {
  return async function (req, res, next) {
    try {
      const page = {
        offset: _.get(req, 'query.page.offset', 0),
        limit: _.get(req, 'query.page.limit', 10)
      };

      // which attributes to read of every user
      const fields = ['username', 'givenName', 'familyName', 'birthday'];

      const users = await model.users.list({ role, fields, page });

      const sanitizedUsers = users.map(user => {
        const sanitized = _.pick(user, ['username', 'givenName']);
        sanitized.age = format.age(user.birthday);
        return sanitized;
      });

      const output = userSerializer.user(sanitizedUsers);

      return res.status(200).json(output);

    } catch (e) {
      return next(e);
    }
  };
}

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

module.exports = { get, patchActive, post };

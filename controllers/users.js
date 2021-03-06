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
      const fields = ['username', 'givenName', 'familyName', 'birthday', 'gender', 'role'];

      // get filters
      let genderFilter = _.get(req, 'query.filter.gender');
      genderFilter = (genderFilter) ? genderFilter.split(',') : null;

      let minAgeFilter = _.get(req, 'query.filter.age.min');
      minAgeFilter = (minAgeFilter) ? +minAgeFilter : null;

      let maxAgeFilter = _.get(req, 'query.filter.age.max');
      maxAgeFilter = (maxAgeFilter) ? +maxAgeFilter : null;

      let languageFilter = _.get(req, 'query.filter.language');
      languageFilter = (languageFilter) ? languageFilter.split(',') : null;

      const filter = {
        gender: genderFilter,
        minAge: minAgeFilter,
        maxAge: maxAgeFilter,
        language: languageFilter
      };

      const users = await model.users.list({ role, fields, page, filter });

      const sanitizedUsers = users.map(user => {
        const sanitized = _.pick(user, ['username', 'givenName', 'role', 'languages', 'gender']);
        sanitized.age = format.age(user.birthday);

        // buddies can share family name, too
        if (role === 'buddy') {
          sanitized.familyName = user.familyName;
        }

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

async function patchAvailable(req, res, next) {
  try {
    const { available } = req.body;
    const { username } = req.params;

    await model.users.updateAvailable(username, available);
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

module.exports = { get, patchActive, patchAvailable, post };

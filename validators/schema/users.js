'use strict';

const {
  username, email, password, role,
  givenName, familyName, birthday, gender
} = require('./paths').user;

const post = {
  properties: {
    body: {
      properties: {
        username,
        email,
        password,
        role,
        givenName,
        familyName,
        birthday,
        gender
      },
      required: ['username', 'email', 'password', 'role', 'givenName', 'familyName', 'birthday', 'gender'],
      additionalProperties: false
    }
  }
};

module.exports = { post };

'use strict';

const {
  username, email, password, role,
  givenName, familyName, birthday, gender
} = require('./paths').user;

const patchActive = {
  properties: {
    body: {
      properties: {
        active: {
          type: 'boolean'
        },
        id: username
      },
      required: ['id', 'active'],
      additionalProperties: false
    }
  }
};

const patchAvailable = {
  properties: {
    body: {
      properties: {
        available: {
          type: 'boolean'
        },
        id: username
      },
      required: ['id', 'available'],
      additionalProperties: false
    }
  }
};

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

module.exports = { patchActive, patchAvailable, post };

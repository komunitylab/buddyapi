'use strict';

const Serializer = require('jsonapi-serializer').Serializer;

const userSerializer = new Serializer('users', {
  attributes: ['givenName', 'familyName', 'age', 'role', 'gender', 'languages'],
  keyForAttribute: 'camelCase',
  id: 'username'
});

function user(data) {
  return userSerializer.serialize(data);
}

module.exports = { user };

'use strict';


const { Deserializer } = require('jsonapi-serializer');

// deserializing
const deserialize = new Deserializer({
  keyForAttribute: 'camelCase',
  users: {
    valueForRelationship: function (relationship) {
      return relationship.id;
    }
  },
  languages: {
    valueForRelationship: function (relationship) {
      return relationship.id;
    }
  }
}).deserialize;

// express middleware for deserializing the data in body
function deserializeMiddleware(req, res, next) {
  deserialize(req.body, function (err, resp) {
    if (err) return next(err); // TODO

    req.rawBody = req.body;

    req.body = resp;

    return next();
  });
}

module.exports = { deserialize: deserializeMiddleware };

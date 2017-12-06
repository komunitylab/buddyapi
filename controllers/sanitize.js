'use strict';

const path = require('path');

const textService = require(path.resolve('./services/text'));

/**
 * Provided array of body properties, will sanitize these properties to a secure html
 */
function html(fields) {
  return function (req, res, next) {
    fields.forEach(field => {
      if (req.body.hasOwnProperty(field)) {
        req.body[field] = textService.html(req.body[field]);
      }
    });

    return next();
  };
}

module.exports = { html };

'use strict';

const _ = require('lodash');

/**
 * choose a route based on req.query, req.body etc
 * @param {string[]} paths - check existence of the provided paths on req object
 *
 * @returns express middleware
 */
module.exports = function (paths) {
  return function (req, res, next) {
    const go = paths.every(path => _.has(req, path));

    // we're in the right router. continue...
    if (go) return next();

    // wrong router. check another one.
    next('route');
  };
};

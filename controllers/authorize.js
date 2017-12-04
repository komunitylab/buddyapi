'use strict';

const errorResponse = {
  errors: [{
    title: 'Not Authorized'
  }]
};

function onlyAdmin(req, res, next) {
  if (req.auth.admin === true) return next();

  return res.status(403).json(errorResponse);
}

function onlyActiveBuddy(req, res, next) {
  if (req.auth.logged === true && req.auth.role === 'buddy' && req.auth.active === true) return next();

  return res.status(403).json(errorResponse);
}

function onlyComer(req, res, next) {
  if (req.auth.logged === true && req.auth.role === 'comer') return next();

  return res.status(403).json(errorResponse);
}

function onlyLoggedMe(req, res, next) {
  if (req.auth.logged === true && req.auth.username === req.params.username) return next();

  return res.status(403).json(errorResponse);
}

module.exports = { onlyActiveBuddy, onlyAdmin, onlyComer, onlyLoggedMe };

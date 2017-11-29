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

module.exports = { onlyAdmin };

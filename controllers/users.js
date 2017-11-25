'use strict';

const path = require('path');

const model = require(path.resolve('./model'));

async function create(req, res, next) {
  try {
    await model.users.create(req.body);

    return res.status(201).json({});
  } catch (e) {
    return next(e);
  }
}

module.exports = { create };

'use strict';

const path = require('path');

const model = require(path.resolve('./model'));

async function post(req, res, next) {
  try {
    const sender = req.auth.username;
    const { receiver, body } = req.body;

    await model.messages.create(sender, receiver, body);

    return res.status(201).json();
  } catch (e) {
    switch (e.message) {
      case 'not found':
        return res.status(404).json();
      default:
        return next(e);
    }
  }
}

module.exports = { post };

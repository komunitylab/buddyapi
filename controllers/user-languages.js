'use strict';

const path = require('path');

const model = require(path.resolve('./model'));

// delete
async function del(req, res, next) {
  try {
    const { username, language } = req.params;

    await model.languages.removeFromUser(username, language);

    return res.status(204).json();

  } catch (e) {
    switch (e.message) {
      case 'not found':
        return res.status(404).json();
      default:
        return next(e);
    }
  }
}

// post
async function post(req, res, next) {
  try {
    const { username } = req.params;
    const { level, language } = req.body;

    await model.languages.addToUser(username, language, level);

    return res.status(201).json();

  } catch (e) {
    switch (e.message) {
      case 'not found':
        return res.status(404).json();
      case 'duplicate':
        return res.status(409).json();
      default:
        return next(e);
    }
  }
}

module.exports = { del, post };

'use strict';

const camelize = require('camelize'),
      _ = require('lodash'),
      path = require('path');
const pool = require('../db'),
      account = require(path.resolve('./services/account')),
      config = require(path.resolve('./config'));

/**
 * Save a new user into database
 */
async function create({ username, email, role, givenName, familyName, gender, birthday, password }) {

  const { hash, salt, iterations } = await account.hash(password);

  const verifyEmailCode = await account.generateHexCode(32);

  const { hash: teHash, salt: teSalt, iterations: teIterations } = await account.hash(verifyEmailCode);

  const created = Date.now();

  const query = `INSERT INTO user
    (username, temporary_email, role, given_name, family_name, gender, birthday,
      password_hash, password_salt, password_iterations,
      te_hash, te_salt, te_iterations, te_expire,
      created)
    VALUES (?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?)`;
  const params = [
    username, email, role, givenName, familyName, gender, birthday,
    hash, salt, iterations,
    teHash, teSalt, teIterations, created + config.emailVerificationCodeExpire,
    created
  ];

  try {
    await pool.execute(query, params);
  } catch (e) {
    switch (e.errno) {
      case 1062: {
        e.status = 409;
        break;
      }
    }

    throw e;
  }

  return verifyEmailCode;
}

async function read(username, fields = ['username']) {
  const snakeFields = fields.map(field => _.snakeCase(field));
  const query = `SELECT ${snakeFields.join(', ')} FROM user WHERE username = ?`;
  const params = [username];

  const [rows] = await pool.execute(query, params);

  switch (rows.length) {
    case 0:
      throw new Error('user not found');
    case 1:
      return camelize(rows[0]);
    default:
      throw new Error('duplicate user');
  }
}

async function verifyEmail(username, code) {
  // read the temporary email data
  const {
    temporaryEmail,
    teHash: hash,
    teSalt: salt,
    teIterations: iterations,
    teExpire: expiration
  } = await read(username, ['temporaryEmail', 'teHash', 'teSalt', 'teIterations', 'teExpire']);

  if (temporaryEmail === null) {
    throw new Error('email already verified');
  }

  // verify that code is not expired
  const isExpired = Date.now() > expiration;
  if (isExpired) {
    throw new Error('expired code');
  }

  // verify that code is correct
  const isCorrect = await account.compare(code, { hash, salt, iterations });
  if (!isCorrect) {
    throw new Error('wrong code');
  }

  // update the email and clear the email verification data
  try {
    await _finalVerifyEmail(username);
  } catch (e) {
    if (e.errno === 1062) { // duplicate entry (of email probably)
      e.status = 409; // set status to conflict
    }
    throw e;
  }
}

// outside used only in tests
async function _finalVerifyEmail(username) {
  // update the email and clear the email verification data
  const query = `UPDATE user
    SET email = temporary_email,
        temporary_email = NULL,
        te_hash = NULL,
        te_salt = NULL,
        te_iterations = NULL,
        te_expire = NULL
    WHERE user.username = ?`;
  const params = [username];

  await pool.execute(query, params);
}

/**
 * make or unmake user to admin
 */
async function updateAdmin(username, admin) {
  // update the email and clear the email verification data
  const query = 'UPDATE user SET admin = ? WHERE username = ?';
  const params = [(admin === true) ? 1 : 0, username];

  await pool.execute(query, params);
}

module.exports = { create, read, updateAdmin, verifyEmail, _finalVerifyEmail };

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

async function list({ fields = ['username'], role, page: { offset = 0, limit = 10} = { }, filter: { gender, minAge, maxAge } } = { }) {

  // generate query:
  //
  // include filters
  //
  // gender
  const genderFilter = (gender) ? `AND gender IN (${Array(gender.length).fill('?').join(',')})` : '';
  const genderParam = (gender) ? gender : [];
  //
  // age
  const year = 365.25 * 24 * 3600 * 1000;
  //
  const minAgeFilter = (minAge) ? 'AND birthday < ?' : '';
  const minAgeParam = (minAge) ? [Date.now() - minAge * year] : [];
  //
  const maxAgeFilter = (maxAge) ? 'AND birthday > ?' : '';
  const maxAgeParam = (maxAge) ? [Date.now() - (maxAge + 1) * year] : [];

  // format fields to return
  const snakeFields = fields.map(field => _.snakeCase(field));

  const query = `SELECT ${snakeFields.join(', ')} FROM user
    WHERE email IS NOT NULL
    AND role = ?
    ${genderFilter}
    ${minAgeFilter}
    ${maxAgeFilter}
    ORDER BY username
    LIMIT ?,?`;

  const params = [role].concat(genderParam, minAgeParam, maxAgeParam, [offset, limit]);

  const [rows] = await pool.execute(query, params);

  return camelize(rows);
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
  // update the admin boolean
  const query = 'UPDATE user SET admin = ? WHERE username = ?';
  const params = [(admin === true) ? 1 : 0, username];

  await pool.execute(query, params);
}

/**
 * make buddy active or inactive
 */
async function updateActive(username, active) {
  // update only buddies with verified email
  const query = `UPDATE user SET active = ?
    WHERE username = ? AND role = 'buddy' AND email IS NOT NULL`;
  const params = [(active === true) ? 1 : 0, username];

  const [{ affectedRows }] = await pool.execute(query, params);

  switch (affectedRows) {
    case 0:
      throw new Error('not found');
    case 1:
      return;
    default:
      throw new Error('too many updates!');
  }
}

module.exports = { create, list, read, updateActive, updateAdmin, verifyEmail, _finalVerifyEmail };

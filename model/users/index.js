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
async function create({ username, email, role, givenName, familyName, gender, birthday, password, available = true }) {

  const { hash, salt, iterations } = await account.hash(password);

  const verifyEmailCode = await account.generateHexCode(32);

  const { hash: teHash, salt: teSalt, iterations: teIterations } = await account.hash(verifyEmailCode);

  const created = Date.now();

  const query = `INSERT INTO user
    (username, temporary_email, role, given_name, family_name, gender, birthday,
      password_hash, password_salt, password_iterations,
      te_hash, te_salt, te_iterations, te_expire,
      available, created)
    VALUES (?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?)`;
  const params = [
    username, email, role, givenName, familyName, gender, birthday,
    hash, salt, iterations,
    teHash, teSalt, teIterations, created + config.emailVerificationCodeExpire,
    ~~available, created
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

async function list({ fields = ['username'], role, page: { offset = 0, limit = 10} = { }, filter: { gender, minAge, maxAge, language } } = { }) {

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
  //
  // languages
  const languageFilter = (language) ? `AND l.code2 IN (${Array(language.length).fill('?').join(',')})` : '';
  const languageParam = (language) ? language: [];

  // format fields to return
  const snakeFields = fields.map(field => _.snakeCase(field));

  const query = `SELECT ${snakeFields.join(', ')},
    GROUP_CONCAT(l.code2 SEPARATOR ',') AS languages,
    GROUP_CONCAT(ul.level SEPARATOR ',') AS levels,
    SUM(ul.level) AS level_sum
    FROM user AS u
    LEFT JOIN user_lang AS ul ON ul.user_id = u.id
    LEFT JOIN language AS l ON ul.lang_id = l.id
    WHERE u.email IS NOT NULL
    AND u.role = ?
    ${languageFilter}
    ${genderFilter}
    ${minAgeFilter}
    ${maxAgeFilter}
    GROUP BY u.id
    ORDER BY ${(language) ? 'level_sum DESC' : 'u.username'}
    LIMIT ?,?`;

  const params = [role].concat(languageParam, genderParam, minAgeParam, maxAgeParam, [offset, limit]);

  const [rows] = await pool.execute(query, params);

  // remap languages and levels strings to array
  rows.forEach(row => {
    if (row.languages) {
      const codes = row.languages.split(',');
      const levels = row.levels.split(',');

      const defLevels = ['beginner', 'intermediate', 'advanced', 'native'];

      row.languages = codes.map((code, i) => {
        return {
          code2: code,
          level: levels[i]
        };
      }).sort((a, b) => {
        const aLevel = defLevels.indexOf(a.level);
        const bLevel = defLevels.indexOf(b.level);

        return (aLevel > bLevel) ? -1 : 1;
      });
    } else {
      row.languages = [];
    }

    delete row.levels;
  });

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

/**
 * make user (buddy or comer) available or unavailable
 */
async function updateAvailable(username, available) {
  // update only buddies with verified email
  const query = `UPDATE user SET available = ?
    WHERE username = ? AND email IS NOT NULL`;
  const params = [(available === true) ? 1 : 0, username];

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

module.exports = { create, list, read, updateActive, updateAdmin, updateAvailable, verifyEmail, _finalVerifyEmail };

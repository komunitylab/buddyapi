'use strict';

const camelize = require('camelize');
const pool = require('../db'),
      account = require('./account');

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
    teHash, teSalt, teIterations, Date.now(),
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

async function read(username) {
  const query = 'SELECT * FROM user WHERE username = ?';
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

module.exports = { create, read };

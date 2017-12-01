'use strict';

const _ = require('lodash'),
      path = require('path');

const dbTables = require(path.resolve('./model/dbTables')),
      model = require(path.resolve('./model')),
      pool = require(path.resolve('./model/db'));

const tableNames = dbTables.map(table => table.name);

/**
 * clear all tables in testing database
 */
async function clear() {
  for (const table of tableNames) {
    await pool.query(`DELETE FROM ${table}`);
  }
}

/**
 * Fill database with data based on provided and default definitions
 */
async function fill(definitions) {

  // set default definitions
  const defaults = {
    users: 0,
    details: [],
    verifiedUsers: [],
    admins: [],
    buddies: [],
    active: [],
    comers: []
  };
  definitions = _.defaults(definitions, defaults);

  // generate data
  const data = generateData(definitions);

  // save users to database
  for (const user of data.users) {
    await model.users.create(user);

    // verify specified users
    if (user.verified) {
      await model.users._finalVerifyEmail(user.username);
    }

    if (user.admin) {
      await model.users.updateAdmin(user.username, true);
    }

    if (user.active) {
      await model.users.updateActive(user.username, true);
    }
  }

  return data;
}

/**
 * Based on provided definitions create data of database rows (documents)
 */
function generateData(def) {

  const users = _.range(def.users).map(n => {

    const role = (def.buddies.includes(n))
      ? 'buddy'
      : (def.comers.includes(n))
        ? 'comer'
        : (n % 2) ? 'comer' : 'buddy';

    const user = {
      username: `user${n}`,
      password: `a*.0-p)${n}xiy&`,
      email: `user${n}@example.com`,
      givenName: `Given${n}`,
      familyName: `family${n}`,
      birthday: '1991-01-01',
      gender: (n % 2) ? 'female': 'male',
      role,
      verified: def.verifiedUsers.includes(n),
      admin: def.admins.includes(n),
      active: def.active.includes(n) && def.buddies.includes(n) // only buddies should be active
    };

    // overwrite with detail
    Object.assign(user, def.details[n]);

    return user;
  });

  return { users };
}

module.exports = { clear, fill };

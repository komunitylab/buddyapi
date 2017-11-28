'use strict';

const path = require('path');

const dbTables = require(path.resolve('./model/dbTables')),
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

module.exports = { clear };

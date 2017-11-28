'use strict';

const path = require('path'),
      db = require('./db'),
      pool = require(path.resolve('./model/db'));

/**
 * Cleanup database after every test
 */
afterEach(async () => {
  await db.clear();
});

/**
 * End connection to mysql database
 */
after(async () => {
  await pool.end();
});

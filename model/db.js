'use strict';

/**
 * setup mysql database connection
 */

const mysql = require('mysql2/promise'),
      path = require('path'),
      config = require(path.resolve('./config'));

const { host, user, password, database } = config.database;

const pool = mysql.createPool({ host, user, password, database });

module.exports = pool;

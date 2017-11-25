'use strict';

const mysql = require('mysql2/promise'),
      path = require('path');

const tables = require(path.resolve('./model/dbTables')),
      config = require(path.resolve('./config'));

// database configuration
const { host, user, database: dbname, password } = config.database;

(async function main() {
  let connection;

  try {
    // credentials for travis-ci
    const admin = 'root';
    const adminPwd = '';

    // connection with root user
    // or user with enough privileges to create users, databases, tables, ...)
    connection = await mysql.createConnection({
      host,
      user: admin,
      password: adminPwd
    });

    await createDatabase(dbname, connection);
    await createUser(user, password, dbname, connection);

    await connection.query(`USE ${dbname}`);

    await createTables(tables, connection);


  } catch (e) {
    console.error(e); // eslint-disable-line no-console
  } finally {
    await connection.end();
  }
}());

/**
 * Create database
 * @param {string} dbname - name of the database to create
 * @param {object} connection - mysql2/promise connection object
 */
async function createDatabase(dbname, connection) {
  await connection.query(`CREATE DATABASE ${dbname}`);
}

/**
 * Create or recreate user
 * @param {string} username
 * @param {string} password
 * @param {string} dbname - will grant INSERT, SELECT, UPDATE and DELETE privileges on all tables of database with the name dbname
 * @param {object} connection - mysql2/promise connection object
 */
async function createUser(username, password, dbname, connection) {
  // create user and grant privileges
  await connection.query(`GRANT INSERT, SELECT, UPDATE, DELETE ON ${dbname}.* TO ?@? IDENTIFIED BY ?`, [username, host, password]);
  await connection.query('FLUSH PRIVILEGES');
}

/**
 * Create tables defined in ./model/dbTables.js (custom syntax)
 * @param {object} tables - config object for tables
 * @param {object} connection - mysql2/promise connection
 */
async function createTables(tables, connection) {
  for (const table of tables) {
    const query = tableToQuery(table);

    await connection.query(query);
  }
}

/**
 * provided an object with table definition (see ./model/dbTables.js)
 * will generate a query string for the table creation
 */
function tableToQuery({ name, columns, keys: { primary, foreign = [] }, unique = [] }) {
  const formatted = [];

  // format columns
  for (const column in columns) {
    formatted.push(`${column} ${columns[column]}`);
  }

  // format primary keys
  if (primary) {
    formatted.push(`PRIMARY KEY (${primary})`);
  }

  // format foreign keys
  for (const { col, ref, more = '' } of foreign) {
    formatted.push(`FOREIGN KEY (${col}) REFERENCES ${ref} ${more}`);
  }

  // format unique constraints
  for (const cols of unique) {
    formatted.push(`UNIQUE (${cols.join(',')})`);
  }

  // put it all together
  return `CREATE TABLE ${name} (${formatted.join(', ')})`;
}

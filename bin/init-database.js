'use strict';

const env = process.env.NODE_ENV;

if (!env || !['development', 'production', 'test'].includes(env)) {
  throw new Error('you need to specify environment, i.e. NODE_ENV=development [command]\nallowed environments: development, production, test');
}

// TODO this should be moved to config
const host = 'localhost',
      dbname = `buddy_${env}`,
      user = dbname,
      password = 'password';


const mysql = require('mysql2/promise'),
      path = require('path'),
      prompt = require('prompt'),
      { promisify } = require('util');

const tables = require(path.resolve('./model/dbTables'));

(async function main() {
  let connection;

  try {
    // ask for mysql root username and password
    const schema = { properties: {
      admin: {
        description: 'mysql root user',
        default: 'root'
      },
      adminPwd: {
        description: 'password',
        hidden: true
      }
    } };

    prompt.start();

    const { admin, adminPwd } = await (promisify(prompt.get))(schema);

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
 * Create database. If database already exists, ask whether to rewrite.
 * @param {string} dbname - name of the database to create
 * @param {object} connection - mysql2/promise connection object
 */
async function createDatabase(dbname, connection) {
  try {
    await connection.query(`CREATE DATABASE ${dbname}`);
  } catch (e) {
    // drop if already exists (and ask for confirmation)
    if (e.code === 'ER_DB_CREATE_EXISTS') {
      const schema = { properties: {
        drop: {
          description: `database ${dbname} already exists. drop it? (y/N)`,
          default: 'n'
        }
      } };

      const { drop } = await (promisify(prompt.get))(schema);

      if (drop === 'y') {
        await connection.execute(`DROP DATABASE ${dbname}`);
        await connection.execute(`CREATE DATABASE ${dbname}`);
        return;
      } else {
        throw('aborted');
      }
    }

    throw e;
  }
}

/**
 * Create or recreate user
 * @param {string} username
 * @param {string} password
 * @param {string} dbname - will grant INSERT, SELECT, UPDATE and DELETE privileges on all tables of database with the name dbname
 * @param {object} connection - mysql2/promise connection object
 */
async function createUser(username, password, dbname, connection) {
  // drop user if exists
  await connection.query('DROP USER IF EXISTS ?@\'localhost\'', [username]);

  // (re)create user and grant privileges
  await connection.query(`GRANT INSERT, SELECT, UPDATE, DELETE ON ${dbname}.* TO ?@? IDENTIFIED BY ?`, ['localhost', username, password]);
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

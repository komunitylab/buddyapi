'use strict';

/**
 * table definitions - array of objects with:
 * - table name: name: 'table_name'
 * - table columns: columns: { columnName: 'type' }
 * - primary key: keys.primary: 'key1',
 * - foreign keys: keys.foreign: [{ col: 'column_name (foreign key)', ref: 'foreign_table(column_name) (reference to foreign table)', more: 'further rules' }, ...]
 * - unique constraints: unique: [[one or more columns], [...]]
 * - @TODO indexes
 *
 * used in ./bin/init-database.js
 */

module.exports = [
  {
    name: 'user',
    columns: {
      id: 'INT UNSIGNED NOT NULL AUTO_INCREMENT',
      username: 'VARCHAR(64)', // user identified
      email: 'VARCHAR(128)', // email
      role: 'ENUM(\'buddy\', \'comer\')',
      admin: 'BOOLEAN DEFAULT FALSE',
      active: 'BOOLEAN DEFAULT FALSE', // if buddy, can contact comers (admin sets this)
      available: 'BOOLEAN DEFAULT FALSE', // is buddy or comer looking for match?
      password_hash: 'CHAR(88)', // hashed password
      password_salt: 'CHAR(88)',
      password_iterations: 'MEDIUMINT UNSIGNED',
      given_name: 'VARCHAR(64)', // profile
      family_name: 'VARCHAR(64)', // profile
      gender: 'ENUM(\'male\', \'female\', \'other\')', // profile
      birthday: 'BIGINT', // profile (display only age), javascript timestamp (also before 1.1.1970)
      about: 'MEDIUMTEXT', // profile
      temporary_email: 'varchar(128)',
      te_hash: 'CHAR(88)', // hashed email verification code
      te_salt: 'CHAR(88)',
      te_iterations: 'MEDIUMINT UNSIGNED',
      te_expire: 'BIGINT UNSIGNED', // when verification code expires, javascript timestamp
      pass_reset_hash: 'CHAR(88)',
      pass_reset_salt: 'CHAR(88)',
      pass_reset_iterations: 'MEDIUMINT UNSIGNED',
      pass_reset_expire: 'BIGINT UNSIGNED', // javascript timestamp
      created: 'BIGINT UNSIGNED' // javascript timestamp
    },
    keys: {
      primary: 'id'
    },
    unique: [['username'], ['email']]
  },
  {
    name: 'language',
    columns: {
      id: 'SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT',
      code2: 'CHAR(2)',
      cs: 'VARCHAR(32)',
      en: 'VARCHAR(32)',
      original: 'VARCHAR(32)'
    },
    keys: {
      primary: 'id'
    },
    unique: [['code2']]
  },
  {
    name: 'user_lang',
    columns: {
      user_id: 'INT UNSIGNED NOT NULL',
      lang_id: 'SMALLINT UNSIGNED NOT NULL',
      level: 'ENUM(\'beginner\', \'intermediate\', \'advanced\', \'native\')'
    },
    keys: {
      foreign: [
        {
          col: 'user_id',
          ref: 'user(id)',
          more: 'ON DELETE CASCADE'
        },
        {
          col: 'lang_id',
          ref: 'language(id)',
          more: 'ON DELETE CASCADE'
        }
      ]
    },
    unique: [['user_id', 'lang_id']]
  }
];

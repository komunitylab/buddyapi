'use strict';

const pool = require('./db');

async function create(language) {
  await pool.execute('INSERT INTO language (code2) VALUES (?)', [language]);
}

async function addToUser(username, language, level) {
  try {
    const query = `INSERT INTO user_lang (level, user_id, lang_id)
      SELECT ? AS level, user.id, language.id
      FROM user CROSS JOIN language
      WHERE user.username = ?
      AND language.code2 = ?`;

    const params = [level, username, language];

    const [info] = await pool.execute(query, params);

    switch (info.affectedRows) {
      case 0:
        throw new Error('not found');
      case 1:
        return;
      default:
        throw new Error('multiple inserts');
    }
  } catch (e) {
    if (e.errno === 1062) { // duplicate entry
      throw new Error('duplicate');
    }

    throw e;
  }

}

async function readUserLanguages(username) {
  const [rows] = await pool.execute(`SELECT (l.code2)
    FROM user AS u
    INNER JOIN user_lang AS ul ON u.id = ul.user_id
    INNER JOIN language AS l ON l.id = ul.lang_id
    WHERE u.username = ?`, [username]);

  return rows;
}

module.exports = { create, addToUser, readUserLanguages };

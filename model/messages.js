'use strict';

const camelize = require('camelize');

const pool = require('./db');

/**
 * Read conversation between two users
 */
async function read(userA, userB) {
  const query = `SELECT m.body AS body,
      m.created AS created,
      m.is_read AS is_read,
      from_user.username AS sender,
      to_user.username AS receiver
    FROM message AS m
    INNER JOIN user AS from_user ON from_user.id = m.from_user_id
    INNER JOIN user AS to_user ON to_user.id = m.to_user_id
    WHERE from_user.username IN (?, ?)
    OR to_user.username IN (?, ?)
    ORDER BY m.created DESC`; // newest message first

  const params = [userA, userB, userA, userB];

  const [rows] = await pool.execute(query, params);

  rows.forEach(row => row.is_read = !!row.is_read); // parse TINYINT to boolean

  return camelize(rows);
}

/**
 * Send a message from 'sender' to 'receiver' with text 'body'
 * @param {string} sender
 * @param {string} receiver
 * @param {string} body
 */
async function create(sender, receiver, body) {
  const query = `INSERT INTO message (from_user_id, to_user_id, body, created, is_read, is_notified)
    SELECT from_user.id, to_user.id, ?, ?, 0, 0
    FROM user AS from_user CROSS JOIN user AS to_user
    WHERE from_user.username = ?
    AND to_user.username = ?`;

  const params = [body, Date.now(), sender, receiver];

  await pool.execute(query, params);
}

module.exports = { create, read };

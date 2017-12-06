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

/**
 * Find all messages which are not read and not notified
 * Used for sending notification emails in a job
 */
async function readUnnotified() {
  const query = `SELECT from_user.username AS sender,
    to_user.username AS receiver,
    to_user.email AS receiver_email,
    m.body AS message_body,
    m.id AS message_id,
    m.created AS message_created
    FROM message as m
    INNER JOIN user AS from_user ON from_user.id = m.from_user_id
    INNER JOIN user AS to_user ON to_user.id = m.to_user_id
    WHERE is_read = 0 AND is_notified = 0
    ORDER BY m.created DESC`;
  const [rows] = await pool.execute(query);

  const formattedRows = camelize(rows).map(row => {
    return {
      messages: [{
        body: row.messageBody,
        id: row.messageId,
        created: row.messageCreated
      }],
      sender: {
        username: row.sender
      },
      receiver: {
        username: row.receiver,
        email: row.receiverEmail
      }
    };
  });

  return formattedRows;
}

/**
 * Provided an array of message ids, make all of them notified: true
 * @param {integer[]} ids - list of ids of messages to mark notified: true
 */
async function updateNotified(ids) {

  if (ids.length === 0) return;

  const query = `UPDATE message
    SET is_notified = 1
    WHERE message.id IN (${Array(ids.length).fill('?').join(',')})`;
  const params = ids;
  await pool.execute(query, params);
}

module.exports = { create, read, readUnnotified, updateNotified };

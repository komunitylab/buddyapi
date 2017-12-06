'use strict';

const path = require('path'),
      model = require(path.resolve('./model')),
      mailer = require(path.resolve('./services/mailer'));

async function messages() {
  // find all unread, unnotified messages in the database
  const unnotified = await model.messages.readUnnotified();

  // send notifications
  for (const { messages, sender, receiver } of unnotified) {
    await mailer.notifyMessages({ messages, sender, receiver });
  }

  // collect ids of the messages
  // first as array of arrays (an array for each direction of each thread)
  const threadIds = unnotified.map(({ messages }) => messages.map(msg => msg.id));
  const ids = [].concat(...threadIds);

  // mark messages as notified
  await model.messages.updateNotified(ids);
}

module.exports = { messages };

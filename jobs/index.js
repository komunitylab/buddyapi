'use strict';

/*
 * Here we define jobs which are run regularly
 */

const cron = require('node-cron'),
      notifications = require('./notifications');

const tasks = [];

// start the tasks
function start() {
  // every 5 minutes send notifications about unread messages
  tasks.push(cron.schedule('0 */5 * * * *', notifications.messages));
}

// stop the tasks
function stop() {
  tasks.forEach(task => task.destroy());
}

module.exports = { start, stop };

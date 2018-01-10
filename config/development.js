'use strict';

module.exports = {
  database: {
    host: 'localhost',
    database: 'buddy_test',
    user: 'buddy_test'
  },
  /**
   * Configuration for nodemailer
   */
  /**
   * Config for maildev
   */
  mailer: {
    host: '0.0.0.0',
    port: 1025,
    smtp: 1025,
    web: 1080,
    ignoreTLS: true
  }
  /**
   * Config for localhost smtp server
   */
  /*
  mailer: {
    host: '0.0.0.0',
    port: 25
  }
  */
  /**
   * For mailer settings documentation please refer to https://nodemailer.com/smtp/
   */
};

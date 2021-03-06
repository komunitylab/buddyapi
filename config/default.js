'use strict';

module.exports = {
  // password hashing and other
  security: {
    // iterations for pbkdf2 hashing of passwords
    iterations: 10000
  },
  // when should email verification code expire
  emailVerificationCodeExpire: 2 * 3600 * 1000, // 2 hours in milliseconds
  jwt: {
    expirationTime: '7d', // how long will authentication work?
    adminExpirationTime: 3600 // 1 hour in seconds
  }
};

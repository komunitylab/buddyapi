'use strict';

function age(birthday) {
  const difference = Date.now() - birthday;

  const year = 365.25 * 24 * 3600 * 1000;
  return Math.floor(difference / year);
}

module.exports = { age };

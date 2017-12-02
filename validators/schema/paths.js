'use strict';

const user = {
  username: { $ref: 'sch#/definitions/user/username' },
  email: { $ref: 'sch#/definitions/user/email' },
  password: { $ref: 'sch#/definitions/user/password' },
  role: { $ref: 'sch#/definitions/user/role' },
  givenName: { $ref: 'sch#/definitions/user/givenName' },
  familyName: { $ref: 'sch#/definitions/user/familyName' },
  birthday: { $ref: 'sch#/definitions/user/birthday' },
  gender: { $ref: 'sch#/definitions/user/gender' },
};

const account = {
  code: { $ref: 'sch#/definitions/account/code' },
};

const language = {
  code2: { $ref: 'sch#/definitions/language/code2' },
  level: { $ref: 'sch#/definitions/language/level' }
};

module.exports = { account, language, user };

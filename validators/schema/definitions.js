'use strict';

const user = {
  username: {
    type: 'string',
    minLength: 2,
    maxLength: 32,
    pattern: '^[a-z0-9]+(-[a-z0-9]+)*$'
  },
  email: {
    type: 'string',
    pattern: '^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$',
    maxLength: '128'
  },
  password: {
    type: 'string',
    minLength: 10,
    maxLength: 512
  },
  role: {
    enum: ['buddy', 'comer']
  },
  givenName: {
    type: 'string',
    minLength: 1,
    maxLength: 64,
    pattern: '\\S'
  },
  familyName: {
    type: 'string',
    minLength: 1,
    maxLength: 64,
    pattern: '\\S'
  },
  birthday: {
    type: 'integer', // javascript timestamp
    minimum: new Date('1900-08-04').getTime(),
    maximum: 1500000000000 // very recent timestamp
  },
  gender: {
    enum: ['female', 'male', 'other']
  }
};

const account = {
  code: {
    type: 'string',
    minLength: 32,
    maxLength: 32,
    pattern: '^[\\da-f]*$'
  }
};

const language = {
  code2: {
    type: 'string',
    minLength: 2,
    maxLength: 2,
    pattern: '^[a-z]{2}$'
  },
  level: {
    type: 'string',
    enum: ['beginner', 'intermediate', 'advanced', 'native']
  }
};

const message = {
  body: {
    type: 'string',
    minLength: 1,
    maxLength: 4096,
    pattern: '\\S' // at least 1 non-space character
  }
};

module.exports = { account, language, message, user };

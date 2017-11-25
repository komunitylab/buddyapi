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
    type: 'string',
    minLength: 10,
    maxLength: 10,
    pattern: '^((19|20)\\d\\d)-(0[1-9]|1[012])-(0[1-9]|[12]\\d|3[01])$'
  },
  gender: {
    enum: ['female', 'male', 'other']
  }
};

module.exports = { user };

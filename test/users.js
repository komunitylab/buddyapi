const path = require('path'),
      should = require('should'),
      sinon = require('sinon');

const agentFactory = require('./agent'),
      db = require('./db'),
      userModel = require(path.resolve('./model/users'));

describe('/users', () => {
  let agent,
      sandbox;

  beforeEach(() => {
    agent = agentFactory();

    sandbox = sinon.sandbox.create();
    sandbox.useFakeTimers({
      now: Date.now(),
      toFake: ['Date']
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  afterEach(async () => {
    await db.clear();
  });

  describe('POST', () => {
    context('valid data', () => {
      it('create new user and respond with 201', async () => {
        await agent
          .post('/users')
          .send({
            data: {
              type: 'users',
              attributes: {
                username: 'testuser',
                email: 'email@example.com',
                password: 'somewonderfullystrongpassword',
                role: 'buddy',
                givenName: 'Given',
                familyName: 'Family',
                birthday: '1992-07-30',
                gender: 'female',
              }
            }
          })
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(201);

        // check that user was saved to database
        const user = await userModel.read('testuser');
        should(user).containDeep({
          username: 'testuser',
          temporaryEmail: 'email@example.com',
          role: 'buddy',
          givenName: 'Given',
          familyName: 'Family',
          birthday: '1992-07-30',
          gender: 'female',
          created: Date.now()
        });
      });
    });

    context('invalid data', () => {
      it('[invalid username] 400');
      it('[duplicate username] 409 Conflict');
      it('[invalid email] 400');
      it('[duplicate email] 409 Conflict');
      it('[invalid password] 400');
      it('[invalid role] 400');
      it('[invalid givenName] 400');
      it('[invalid familyName] 400');
      it('[invalid birthday] 400');
      it('[invalid gender] 400');
    });
  });
});

'use strict';

const MailDev = require('maildev'),
      path = require('path'),
      should = require('should'),
      sinon = require('sinon'),
      { promisify } = require('util');

const agentFactory = require('./agent'),
      db = require('./db'),
      userModel = require(path.resolve('./model/users')),
      mailer = require(path.resolve('./services/mailer'));

describe('/users', () => {
  let agent,
      maildev,
      sandbox;

  // start and stop maildev for the tests
  before(async () => {
    maildev = new MailDev();
    await (promisify(maildev.listen)());
  });

  after(async () => {
    await (promisify(maildev.close)());
  });

  beforeEach(() => {
    agent = agentFactory();

    sandbox = sinon.sandbox.create();
    sandbox.useFakeTimers({
      now: Date.now(),
      toFake: ['Date']
    });
    sandbox.spy(mailer, 'general');
  });

  afterEach(() => {
    sandbox.restore();
  });

  afterEach(async () => {
    await db.clear();
  });

  describe('POST', () => {
    let requestBody;

    beforeEach(() => {
      // valid request body
      requestBody = {
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
      };
    });

    context('valid data', () => {
      it('create new user and respond with 201', async () => {
        await agent
          .post('/users')
          .send(requestBody)
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

      it('send verification email', async () => {

        await agent
          .post('/users')
          .send(requestBody)
          .expect(201);

        sinon.assert.calledOnce(mailer.general);
        const message = mailer.general.getCall(0).args[0];

        should(message).containDeep({
          to: '<email@example.com>',
          subject: 'Email verification for Buddy Brno'
        });

        should(message).have.property('text').match(/[\da-f]{32}/);
        should(message).have.property('html').match(/[\da-f]{32}/);
      });
    });

    context('invalid data', () => {

      it('[invalid username] 400', async () => {
        // invalid username
        requestBody.data.attributes.username = 'invalid*username';

        await agent
          .post('/users')
          .send(requestBody)
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(400);
      });

      it('[missing username] 400', async () => {
        // missing username
        delete requestBody.data.attributes.username;

        await agent
          .post('/users')
          .send(requestBody)
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(400);
      });

      it('[duplicate username] 409 Conflict', async () => {
        await agent
          .post('/users')
          .send(requestBody)
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(201);

        await agent
          .post('/users')
          .send(requestBody)
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(409);
      });

      it('[invalid email] 400', async () => {
        // invalid email
        requestBody.data.attributes.email = 'invalid.email@';

        await agent
          .post('/users')
          .send(requestBody)
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(400);
      });

      it('[missing email] 400', async () => {
        // missing email
        delete requestBody.data.attributes.email;

        await agent
          .post('/users')
          .send(requestBody)
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(400);
      });

      it('[duplicate email] 409 Conflict');

      it('[invalid password] 400', async () => {
        // invalid password
        requestBody.data.attributes.password = 'password';

        await agent
          .post('/users')
          .send(requestBody)
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(400);
      });

      it('[missing password] 400', async () => {
        // missing password
        delete requestBody.data.attributes.password;

        await agent
          .post('/users')
          .send(requestBody)
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(400);
      });

      it('[invalid role] 400', async () => {
        // invalid role
        requestBody.data.attributes.role = 'weirdo';

        await agent
          .post('/users')
          .send(requestBody)
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(400);
      });

      it('[missing role] 400', async () => {
        // missing role
        delete requestBody.data.attributes.role;

        await agent
          .post('/users')
          .send(requestBody)
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(400);
      });

      it('[invalid givenName] 400', async () => {
        // invalid givenName
        requestBody.data.attributes.givenName = '     ';

        await agent
          .post('/users')
          .send(requestBody)
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(400);
      });

      it('[missing givenName] 400', async () => {
        // missing givenName
        delete requestBody.data.attributes.givenName;

        await agent
          .post('/users')
          .send(requestBody)
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(400);
      });

      it('[invalid familyName] 400', async () => {
        // invalid familyName
        requestBody.data.attributes.familyName = '     ';

        await agent
          .post('/users')
          .send(requestBody)
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(400);
      });

      it('[missing familyName] 400', async () => {
        // missing familyName
        delete requestBody.data.attributes.familyName;

        await agent
          .post('/users')
          .send(requestBody)
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(400);
      });

      it('[invalid birthday] 400', async () => {
        // invalid birthday
        requestBody.data.attributes.birthday = '1628-02-11';

        await agent
          .post('/users')
          .send(requestBody)
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(400);
      });

      it('[missing birthday] 400', async () => {
        // missing birthday
        delete requestBody.data.attributes.birthday;

        await agent
          .post('/users')
          .send(requestBody)
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(400);
      });

      it('[invalid gender] 400', async () => {
        // invalid gender
        requestBody.data.attributes.gender = 'foobar';

        await agent
          .post('/users')
          .send(requestBody)
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(400);
      });

      it('[missing gender] 400', async () => {
        // missing gender
        delete requestBody.data.attributes.gender;

        await agent
          .post('/users')
          .send(requestBody)
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(400);
      });

      it('[additional properties] 400', async () => {
        // invalid gender
        requestBody.data.attributes.foo = 'bar';

        await agent
          .post('/users')
          .send(requestBody)
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(400);
      });
    });
  });
});

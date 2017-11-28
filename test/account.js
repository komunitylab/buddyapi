'use strict';

const path = require('path'),
      should = require('should'),
      sinon = require('sinon');

const agentFactory = require('./agent'),
      model = require(path.resolve('./model'));

describe('account', () => {
  let agent,
      sandbox;

  beforeEach(() => {
    agent = agentFactory();
  });

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.useFakeTimers({
      now: 1500000000000,
      toFake: ['Date']
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('verify email', () => {
    let code;

    beforeEach(async () => {
      code = await model.users.create({ username: 'test', email: 'test@example.com', role: '', givenName: '', familyName: '', gender: '', birthday: '', password: '' });
    });

    context('valid data', () => {

      it('verify user\'s email', async () => {
        // before verification user's email = null
        // and emailTemporary = submitted email
        const userBefore = await model.users.read('test', ['email', 'temporaryEmail']);

        should(userBefore.email).eql(null);
        should(userBefore.temporaryEmail).eql('test@example.com');

        await agent
          .patch('/account')
          .send({
            data: {
              type: 'users',
              id: 'test',
              attributes: {
                emailVerificationCode: code
              }
            }
          })
          .expect(200);

        const user = await model.users.read('test', ['email', 'temporaryEmail']);

        // should(user.email).eql('test@example.com');
        should(user.temporaryEmail).eql(null);
      });

      it('[just before expiration] should still pass', async function () {
        // let's wait for almost 2 hours
        const twoHours = 2 * 3600 * 1000;
        sandbox.clock.tick(twoHours - 1);

        // try to verify
        await agent
          .patch('/account')
          .send({
            data: {
              type: 'users',
              id: 'test',
              attributes: {
                emailVerificationCode: code
              }
            }
          })
          .expect('Content-Type', /^application\/vnd\.api\+json/)
          .expect(200);
      });
    });

    context('invalid data', function () {

      it('[invalid username] 400', async function () {
        // we verify the email
        const response = await agent
          .patch('/account')
          .send({
            data: {
              type: 'users',
              id: 'test invalid',
              attributes: {
                emailVerificationCode: code
              }
            }
          })
          .expect('Content-Type', /^application\/vnd\.api\+json/)
          .expect(400);

        should(response.body).have.propertyByPath('errors', 0, 'title')
          .eql('invalid id');

      });

      it('[invalid code] 400', async function () {
        const invalidCode = 'asdf.123de';

        // we verify the email
        const response = await agent
          .patch('/account')
          .send({
            data: {
              type: 'users',
              id: 'test',
              attributes: {
                emailVerificationCode: invalidCode
              }
            }
          })
          .expect('Content-Type', /^application\/vnd\.api\+json/)
          .expect(400);

        should(response.body).have.propertyByPath('errors', 0, 'title')
          .eql('invalid emailVerificationCode');
      });

      it('[wrong code] should error', async function () {
        const wrongCode = 'a'.repeat(32);

        // we verify the email
        const response = await agent
          .patch('/account')
          .send({
            data: {
              type: 'users',
              id: 'test',
              attributes: {
                emailVerificationCode: wrongCode
              }
            }
          })
          .expect('Content-Type', /^application\/vnd\.api\+json/)
          .expect(400);

        should(response.body).have.propertyByPath('errors', 0, 'title')
          .eql('invalid code');

        should(response.body).have.propertyByPath('errors', 0, 'detail')
          .eql('code is wrong');

        // see whether the user's email is verified now
        const user = await model.users.read('test', ['email']);

        user.should.have.property('email', null);
      });

      it('[expired code] should error 400', async function () {
        // let's wait for 2 hours and 1 millisecond
        const twoHours = 2 * 3600 * 1000;
        sandbox.clock.tick(twoHours + 1);

        // try to verify
        const response = await agent
          .patch('/account')
          .send({
            data: {
              type: 'users',
              id: 'test',
              attributes: {
                emailVerificationCode: code
              }
            }
          })
          .expect('Content-Type', /^application\/vnd\.api\+json/)
          .expect(400);

        should(response.body).have.propertyByPath('errors', 0, 'title')
          .eql('invalid code');

        should(response.body).have.propertyByPath('errors', 0, 'detail')
          .eql('code is expired');
      });

      it('[reused code] should error', async function () {
        // we verify the email
        await agent
          .patch('/account')
          .send({
            data: {
              type: 'users',
              id: 'test',
              attributes: {
                emailVerificationCode: code
              }
            }
          })
          .expect('Content-Type', /^application\/vnd\.api\+json/)
          .expect(200);

        sandbox.clock.tick(5000);

        const response = await agent
          .patch('/account')
          .send({
            data: {
              type: 'users',
              id: 'test',
              attributes: {
                emailVerificationCode: code
              }
            }
          })
          .expect('Content-Type', /^application\/vnd\.api\+json/)
          .expect(400);

        should(response.body).have.propertyByPath('errors', 0, 'title')
          .eql('invalid request');

        should(response.body).have.propertyByPath('errors', 0, 'detail')
          .eql('email is already verified');
      });

      it('[additional attributes in body] 400', async () => {
        await agent
          .patch('/account')
          .send({
            data: {
              type: 'users',
              id: 'test',
              attributes: {
                emailVerificationCode: code,
                additional: false
              }
            }
          })
          .expect(400);
      });
    });
  });
});

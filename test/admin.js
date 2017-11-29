'use strict';

const path = require('path'),
      should = require('should'),
      sinon = require('sinon');

const agentFactory = require('./agent'),
      db = require('./db'),
      model = require(path.resolve('./model'));

describe('admin', () => {
  let agent,
      sandbox;

  beforeEach(() => {
    agent = agentFactory();
  });

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    sandbox.useFakeTimers({
      toFake: ['Date'],
      now: 1500000000000
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('activate/desactivate buddy', () => {
    let activeBuddy,
        comer,
        inactiveBuddy,
        unverifiedBuddy;

    // fill database with some data
    beforeEach(async () => {
      const dbData = await db.fill({
        users: 4,
        verifiedUsers: [0, 1, 2],
        buddies: [1, 2, 3],
        active: [2],
        comers: [0]
      });

      [comer, inactiveBuddy, activeBuddy, unverifiedBuddy] = dbData.users;
    });

    context('admin', () => {
      beforeEach(() => {
        agent = agentFactory.logged({ admin: true });
      });

      context('valid data', () => {

        it('[activate] make buddy active: true', async () => {

          // before buddy should be inactive
          const before = await model.users.read(inactiveBuddy.username, ['active', 'role', 'email']);

          should(before.active).eql(0);
          should(before.role).eql('buddy');
          should(before.email).ok();

          await agent
            .patch(`/users/${inactiveBuddy.username}`)
            .send({
              data: {
                type: 'users',
                id: inactiveBuddy.username,
                attributes: {
                  active: true
                }
              }
            })
            .expect(200);

          // after buddy should be inactive
          const after = await model.users.read(inactiveBuddy.username, ['active']);

          should(after.active).eql(1);
        });

        it('[desactivate] make buddy active: false', async () => {

          // before buddy should be inactive
          const before = await model.users.read(activeBuddy.username, ['active', 'role', 'email']);

          should(before.active).eql(1);
          should(before.role).eql('buddy');
          should(before.email).ok();

          await agent
            .patch(`/users/${activeBuddy.username}`)
            .send({
              data: {
                type: 'users',
                id: activeBuddy.username,
                attributes: {
                  active: false
                }
              }
            })
            .expect(200);

          // after buddy should be inactive
          const after = await model.users.read(activeBuddy.username, ['active']);

          should(after.active).eql(0);
        });
      });

      context('invalid data', () => {
        it('[user not exist] 404', async () => {
          await agent
            .patch('/users/nonexistent')
            .send({
              data: {
                type: 'users',
                id: 'nonexistent',
                attributes: {
                  active: true
                }
              }
            })
            .expect(404);
        });

        it('[not buddy] 404', async () => {
          // should be comer
          const before = await model.users.read(comer.username, ['role', 'email']);
          should(before.role).eql('comer');
          should(before.email).ok();

          await agent
            .patch(`/users/${comer.username}`)
            .send({
              data: {
                type: 'users',
                id: comer.username,
                attributes: {
                  active: true
                }
              }
            })
            .expect(404);
        });

        it('[not verified] 404', async () => {
          // should be comer
          const before = await model.users.read(unverifiedBuddy.username, ['role', 'email']);
          should(before.role).eql('buddy');
          should(before.email).not.ok();

          await agent
            .patch(`/users/${unverifiedBuddy.username}`)
            .send({
              data: {
                type: 'users',
                id: unverifiedBuddy.username,
                attributes: {
                  active: true
                }
              }
            })
            .expect(404);
        });

        it('[additional parameters] 400 additional parameters', async () => {
          const response = await agent
            .patch(`/users/${inactiveBuddy.username}`)
            .send({
              data: {
                type: 'users',
                id: inactiveBuddy.username,
                attributes: {
                  active: true,
                  additional: 'parameter'
                }
              }
            })
            .expect(400);

          should(response.body).match({ errors: [{
            title: 'invalid property',
            detail: 'unexpected property'
          }] });
        });

        it('[invalid \'active\'] 400 invalid active', async () => {
          const response = await agent
            .patch(`/users/${inactiveBuddy.username}`)
            .send({
              data: {
                type: 'users',
                id: inactiveBuddy.username,
                attributes: {
                  active: 'invalid'
                }
              }
            })
            .expect(400);

          should(response.body).match({ errors: [{
            title: 'invalid active',
            detail: 'should be boolean'
          }] });
        });

        it('[invalid username] 400 invalid username', async () => {
          const response = await agent
            .patch('/users/invalidUsern*me')
            .send({
              data: {
                type: 'users',
                id: 'invalidUsern*me',
                attributes: {
                  active: true
                }
              }
            })
            .expect(400);

          should(response.body).match({ errors: [{
            title: 'invalid id'
          }] });
        });

        it('[mismatch params.username and body.data.id] 400 mismatch', async () => {
          const response = await agent
            .patch(`/users/${activeBuddy.username}`)
            .send({
              data: {
                type: 'users',
                id: inactiveBuddy.username,
                attributes: {
                  active: true
                }
              }
            })
            .expect(400);

          should(response.body).match({ errors: [{
            title: 'invalid',
            detail: 'params.username should match body.id'
          }] });
        });

      });
    });

    context('not admin', () => {
      beforeEach(() => {
        agent = agentFactory.logged();
      });

      it('403', async () => {
        await agent
          .patch(`/users/${inactiveBuddy.username}`)
          .send({
            data: {
              type: 'users',
              id: inactiveBuddy.username,
              attributes: {
                active: true
              }
            }
          })
          .expect(403);
      });
    });
  });
});

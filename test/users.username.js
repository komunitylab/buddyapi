'use strict';

const path = require('path'),
      should = require('should');

const agentFactory = require('./agent'),
      db = require('./db'),
      model = require(path.resolve('./model'));

describe('user', () => {
  let agent,
      unavailableUser,
      availableUser;

  beforeEach(() => {
    agent = agentFactory();
  });

  beforeEach(async () => {
    const dbData = await db.fill({
      users: 3,
      details: [
        { available: false },
        { available: true }
      ],
      verifiedUsers: [0, 1]
    });

    [unavailableUser, availableUser] = dbData.users;
  });

  describe('PATCH /users/:username', () => {
    describe('update availability', () => {
      context('logged as me', () => {

        beforeEach(() => {
          agent = agentFactory.logged(availableUser);
        });

        context('valid data', () => {
          it('respond 200 and update availability to true', async () => {

            const userBefore = await model.users.read(unavailableUser.username, ['username', 'available']);
            should(userBefore.available).eql(false);

            await agentFactory.logged(unavailableUser)
              .patch(`/users/${unavailableUser.username}`)
              .send({
                data: {
                  type: 'users',
                  id: unavailableUser.username,
                  attributes: {
                    available: true
                  }
                }
              })
              .expect(200);

            const userAfter = await model.users.read(unavailableUser.username, ['username', 'available']);
            should(userAfter.available).eql(true);
          });

          it('respond 200 and update availability to false', async () => {

            const userBefore = await model.users.read(availableUser.username, ['username', 'available']);
            should(userBefore.available).eql(true);

            await agent
              .patch(`/users/${availableUser.username}`)
              .send({
                data: {
                  type: 'users',
                  id: availableUser.username,
                  attributes: {
                    available: false
                  }
                }
              })
              .expect(200);

            const userAfter = await model.users.read(availableUser.username, ['username', 'available']);
            should(userAfter.available).eql(false);
          });
        });

        context('invalid data', () => {

          it('[nonexistent user] 404', async () => {
            await agentFactory.logged({ username: 'funny-user' })
              .patch('/users/funny-user')
              .send({
                data: {
                  type: 'users',
                  id: 'funny-user',
                  attributes: {
                    available: false
                  }
                }
              })
              .expect(404);
          });

          it('[invalid username] 400', async () => {
            const response = await agentFactory.logged({ username: 'invalid*user' })
              .patch('/users/invalid*user')
              .send({
                data: {
                  type: 'users',
                  id: 'invalid*user',
                  attributes: {
                    available: false
                  }
                }
              })
              .expect(400);

            should(response.body).match({ errors: [{
              title: 'invalid id'
            }] });
          });

          it('[invalid availability] 400', async () => {
            const response = await agent
              .patch(`/users/${availableUser.username}`)
              .send({
                data: {
                  type: 'users',
                  id: availableUser.username,
                  attributes: {
                    available: 1
                  }
                }
              })
              .expect(400);

            should(response.body).match({ errors: [{
              title: 'invalid available'
            }] });
          });

          it('[additional properties] 400', async () => {
            const response = await agent
              .patch(`/users/${availableUser.username}`)
              .send({
                data: {
                  type: 'users',
                  id: availableUser.username,
                  attributes: {
                    available: true,
                    additional: 'property'
                  }
                }
              })
              .expect(400);

            should(response.body).match({ errors: [{
              title: 'invalid property',
              detail: 'unexpected property additional'
            }] });
          });

          it('[not matching :username and id] 400', async () => {
            const response = await agent
              .patch(`/users/${availableUser.username}`)
              .send({
                data: {
                  type: 'users',
                  id: unavailableUser.username,
                  attributes: {
                    available: true
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

      context('not logged as me', () => {

        it('403', async () => {
          await agentFactory.logged(unavailableUser)
            .patch(`/users/${availableUser.username}`)
            .send({
              data: {
                type: 'users',
                id: availableUser.username,
                attributes: {
                  available: true
                }
              }
            })
            .expect(403);
        });

      });
    });
  });
});

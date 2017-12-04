'use strict';

const path = require('path'),
      should = require('should'),
      sinon = require('sinon');

const agentFactory = require('./agent'),
      db = require('./db'),
      mailer = require(path.resolve('./services/mailer')),
      model = require(path.resolve('./model'));

describe('send messages', () => {
  let agent,
      dbData,
      receiver,
      sandbox,
      sender;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    sandbox.useFakeTimers({
      now: 1234567890000,
      toFake: ['Date']
    });

    sandbox.stub(mailer, 'general');
  });

  afterEach(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    agent = agentFactory();
  });

  beforeEach(async () => {
    dbData = await db.fill({
      users: 3,
      verifiedUsers: [0, 1]
    });

    [sender, receiver] = dbData.users;
  });

  describe('send: POST /messages', () => {

    context('logged in as comer or active buddy', () => {

      beforeEach(() => {
        agent = agentFactory.logged(sender);
      });

      context('valid request', () => {

        it('send a message', async () => {

          const messagesBefore = await model.messages.read(sender.username, receiver.username);
          should(messagesBefore).Array().length(0);

          await agent
            .post('/messages')
            .send({
              data: {
                type: 'messages',
                attributes: {
                  body: 'this is a message for you'
                },
                relationships: {
                  to: {
                    data: {
                      type: 'users',
                      id: receiver.username
                    }
                  }
                }
              }
            })
            .expect(201);

          const messagesAfter = await model.messages.read(sender.username, receiver.username);
          should(messagesAfter).Array().length(1);

          // TODO check that message has body, sender, receiver, creation time, whether it was read or not
          should(messagesAfter[0]).match({
            sender: sender.username,
            receiver: receiver.username,
            body: 'this is a message for you',
            created: Date.now(),
            isRead: false
          });
        });

        it('send notification email to receiver'/* , async () => {
          await agent
            .post('/messages')
            .send({
              data: {
                type: 'messages',
                attributes: {
                  body: 'this is a message for you'
                },
                relationships: {
                  to: {
                    data: {
                      type: 'users',
                      id: receiver.username
                    }
                  }
                }
              }
            })
            .expect(201);

          sinon.assert.calledOnce(mailer.general);
          const message = mailer.general.getCall(0).args[0];

          should(message).containDeep({
            to: `<${receiver.email}>`,
            subject: `${sender.username} sent you a message on Buddy Brno`
          });

          // TODO check link in the email
        }*/);

        it('send multiple messages', async () => {
          const messagesBefore = await model.messages.read(sender.username, receiver.username);
          should(messagesBefore).Array().length(0);

          // send the first message from sender to receiver
          await agent
            .post('/messages')
            .send({
              data: {
                type: 'messages',
                attributes: {
                  body: 'message0'
                },
                relationships: {
                  to: {
                    data: {
                      type: 'users',
                      id: receiver.username
                    }
                  }
                }
              }
            })
            .expect(201);

          sandbox.clock.tick(1000);

          // send second message from sender to receiver
          await agent
            .post('/messages')
            .send({
              data: {
                type: 'messages',
                attributes: {
                  body: 'message1'
                },
                relationships: {
                  to: {
                    data: {
                      type: 'users',
                      id: receiver.username
                    }
                  }
                }
              }
            })
            .expect(201);

          sandbox.clock.tick(1000);

          // send a message in opposite direction ("receiver" and "sender" switch roles)
          await agentFactory.logged(receiver)
            .post('/messages')
            .send({
              data: {
                type: 'messages',
                attributes: {
                  body: 'message2'
                },
                relationships: {
                  to: {
                    data: {
                      type: 'users',
                      id: sender.username
                    }
                  }
                }
              }
            })
            .expect(201);

          const messagesAfter = await model.messages.read(sender.username, receiver.username);
          should(messagesAfter).Array().length(3);
        });

      });

      context('invalid request', () => {

        it('[invalid receiver username] 400');
        it('[missing receiver] 400');
        it('[nonexistent receiver] 404');
        it('[unverified receiver] 404');
        it('[message to self] 400');
        it('[invalid message body] 400');
        it('[missing message body] 400');
        it('[additional properties] 400');

      });
    });

    context('not logged in', () => {
      it('403');
    });
  });

  describe('update messages to read: PATCH /messages', () => {
    context('logged in', () => {
      it('provided id of a message to me, all older messages will be updated to read');
    });

    context('not logged in', () => {
      it('403');
    });

  });

  describe('GET /messages?filter[threads]', () => {
    context('logged in', () => {
      it('show a list of \'last message of every conversation\'');
    });

    context('not logged in', () => {
      it('403');
    });

  });

  describe('GET /messages?filter[with]=username', () => {
    context('logged in', () => {
      it('show a conversation with a single user');
    });

    context('not logged in', () => {
      it('403');
    });
  });
});

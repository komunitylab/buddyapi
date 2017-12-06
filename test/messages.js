'use strict';

const path = require('path'),
      should = require('should'),
      sinon = require('sinon');

const agentFactory = require('./agent'),
      db = require('./db'),
      mailer = require(path.resolve('./services/mailer')),
      model = require(path.resolve('./model')),
      notificationJobs = require(path.resolve('./jobs/notifications'));

describe('send messages', () => {
  let agent,
      buddyReceiver,
      dbData,
      receiver,
      sandbox,
      sender,
      unverifiedReceiver;

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
      users: 4,
      verifiedUsers: [0, 1, 3],
      buddies: [0, 3],
      active: [0, 3],
      comers: [1, 2]
    });

    [sender, receiver, unverifiedReceiver, buddyReceiver] = dbData.users;
  });

  describe('send: POST /messages', () => {
    let defaultMessage;

    beforeEach(() => {
      defaultMessage = {
        data: {
          type: 'messages',
          attributes: {
            body: 'this is a message for you'
          },
          relationships: {
            receiver: {
              data: {
                type: 'users',
                id: receiver.username
              }
            }
          }
        }
      };
    });

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
            .send(defaultMessage)
            .expect(201);

          const messagesAfter = await model.messages.read(sender.username, receiver.username);
          should(messagesAfter).Array().length(1);

          // check that message has body, sender, receiver, creation time, whether it was read or not
          should(messagesAfter[0]).match({
            sender: sender.username,
            receiver: receiver.username,
            body: 'this is a message for you',
            created: Date.now(),
            isRead: false
          });
        });

        it('send multiple messages', async () => {
          const messagesBefore = await model.messages.read(sender.username, receiver.username);
          should(messagesBefore).Array().length(0);

          // send the first message from sender to receiver
          const message0 = JSON.parse(JSON.stringify(defaultMessage));
          message0.data.attributes.body = 'message0';

          await agent
            .post('/messages')
            .send(message0)
            .expect(201);

          sandbox.clock.tick(1000);

          // send second message from sender to receiver
          const message1 = JSON.parse(JSON.stringify(defaultMessage));
          message1.data.attributes.body = 'message1';

          await agent
            .post('/messages')
            .send(message1)
            .expect(201);

          sandbox.clock.tick(1000);

          // send a message in opposite direction ("receiver" and "sender" switch roles)
          const message2 = JSON.parse(JSON.stringify(defaultMessage));
          message2.data.attributes.body = 'message2';
          message2.data.relationships.receiver.data.id = sender.username;

          await agentFactory.logged(receiver)
            .post('/messages')
            .send(message2)
            .expect(201);

          const messagesAfter = await model.messages.read(sender.username, receiver.username);
          should(messagesAfter).Array().length(3);
        });

        it('trim and sanitize message body for database', async () => {

          const msgSanitize = JSON.parse(JSON.stringify(defaultMessage));
          msgSanitize.data.attributes.body = '  <script>ahoj</script> <a href="https://example.com" target="_blank">asdf</a>  ';

          await agent
            .post('/messages')
            .send(msgSanitize)
            .expect(201);

          const messagesAfter = await model.messages.read(sender.username, receiver.username);
          should(messagesAfter).Array().length(1);

          // check that message body was sanitized and trimmed
          should(messagesAfter[0]).match({
            body: '<a href="https://example.com">asdf</a>',
          });
        });

        describe('email notification for receiver of the message', () => {

          it('send notification email to receiver' , async () => {
            await agent
              .post('/messages')
              .send(defaultMessage)
              .expect(201);

            await notificationJobs.messages();

            sinon.assert.calledOnce(mailer.general);
            const message = mailer.general.getCall(0).args[0];

            should(message).containDeep({
              to: `<${receiver.email}>`,
              subject: `${sender.username} sent you a message on Buddy Brno`
            });

            // TODO check link in the email
          });

          it('send notification only once', async () => {
            await agent
              .post('/messages')
              .send(defaultMessage)
              .expect(201);

            await notificationJobs.messages();
            await notificationJobs.messages();

            sinon.assert.calledOnce(mailer.general);
          });

          it('put multiple messages to a single notification', async () => {
            await agent
              .post('/messages')
              .send(defaultMessage)
              .expect(201);

            sandbox.clock.tick(1000);

            await agent
              .post('/messages')
              .send(defaultMessage)
              .expect(201);

            await notificationJobs.messages();

            sinon.assert.calledOnce(mailer.general);
          });

          it('test multiple messages, multiple directions', async () => {

            defaultMessage.data.attributes.body = 'older message';
            await agent
              .post('/messages')
              .send(defaultMessage)
              .expect(201);

            sandbox.clock.tick(1000);

            defaultMessage.data.attributes.body = 'newer message';
            await agent
              .post('/messages')
              .send(defaultMessage)
              .expect(201);

            // send a message in opposite direction ("receiver" and "sender" switch roles)
            const messageOpposite = JSON.parse(JSON.stringify(defaultMessage));
            messageOpposite.data.attributes.body = 'message2';
            messageOpposite.data.relationships.receiver.data.id = sender.username;
            await agentFactory.logged(receiver)
              .post('/messages')
              .send(messageOpposite)
              .expect(201);

            await notificationJobs.messages();

            sinon.assert.callCount(mailer.general, 2);
          });

        });

      });

      context('invalid request', () => {

        it('[invalid receiver username] 400', async () => {
          const invalidReceiverMessage = JSON.parse(JSON.stringify(defaultMessage));
          invalidReceiverMessage.data.relationships.receiver.data.id = 'inv!lid';

          const response = await agent
            .post('/messages')
            .send(invalidReceiverMessage)
            .expect(400);

          should(response.body).match({ errors: [{
            title: 'invalid receiver'
          }] });
        });

        it('[missing receiver] 400', async () => {
          const invalidReceiverMessage = JSON.parse(JSON.stringify(defaultMessage));
          delete invalidReceiverMessage.data.relationships.receiver;

          const response = await agent
            .post('/messages')
            .send(invalidReceiverMessage)
            .expect(400);

          should(response.body).match({ errors: [{
            title: 'invalid properties',
            detail: 'missing property receiver'
          }] });
        });

        it('[nonexistent receiver] 404', async () => {
          const nonexistentReceiverMessage = JSON.parse(JSON.stringify(defaultMessage));
          nonexistentReceiverMessage.data.relationships.receiver.data.id = 'nonexistent';

          await agent
            .post('/messages')
            .send(nonexistentReceiverMessage)
            .expect(404);
        });

        it('[unverified receiver] 404', async () => {
          const unverifiedReceiverMessage = JSON.parse(JSON.stringify(defaultMessage));
          unverifiedReceiverMessage.data.relationships.receiver.data.id = unverifiedReceiver.username;

          await agent
            .post('/messages')
            .send(unverifiedReceiverMessage)
            .expect(404);
        });

        it('[message to self] 400', async () => {
          const selfMessage = JSON.parse(JSON.stringify(defaultMessage));
          selfMessage.data.relationships.receiver.data.id = sender.username;

          const response = await agent
            .post('/messages')
            .send(selfMessage)
            .expect(400);

          should(response.body).match({ errors: [{
            title: 'invalid'
          }] });
        });

        it('[invalid message body] 400', async () => {
          const invalidBodyMsg = JSON.parse(JSON.stringify(defaultMessage));
          invalidBodyMsg.data.attributes.body = '  ';

          const response = await agent
            .post('/messages')
            .send(invalidBodyMsg)
            .expect(400);

          should(response.body).match({ errors: [{
            title: 'invalid body'
          }] });
        });

        it('[missing message body] 400', async () => {
          const noBodyMsg = JSON.parse(JSON.stringify(defaultMessage));
          delete noBodyMsg.data.attributes.body;

          const response = await agent
            .post('/messages')
            .send(noBodyMsg)
            .expect(400);

          should(response.body).match({ errors: [{
            title: 'invalid properties',
            detail: 'missing property body'
          }] });
        });

        it('[additional properties] 400', async () => {
          const additionalPropertiesMsg = JSON.parse(JSON.stringify(defaultMessage));
          additionalPropertiesMsg.data.attributes.additional = 'property';

          const response = await agent
            .post('/messages')
            .send(additionalPropertiesMsg)
            .expect(400);

          should(response.body).match({ errors: [{
            title: 'invalid property',
            detail: 'unexpected property additional'
          }] });
        });

        it('[not between comer and active buddy] 404', async () => {
          const buddyToBuddyMsg = JSON.parse(JSON.stringify(defaultMessage));
          buddyToBuddyMsg.data.relationships.receiver.data.id = buddyReceiver.username;

          await agent
            .post('/messages')
            .send(buddyToBuddyMsg)
            .expect(404);
        });

      });
    });

    context('not logged in', () => {

      it('403', async () => {
        await agent
          .post('/messages')
          .send(defaultMessage)
          .expect(403);
      });

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

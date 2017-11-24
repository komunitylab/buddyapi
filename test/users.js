const agentFactory = require('./agent');

describe('/users', () => {
  let agent;

  beforeEach(() => {
    agent = agentFactory();
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
                born: '1992-07-30',
                gender: 'female',
              }
            }
          })
          .expect('content-type', /^application\/vnd\.api\+json/)
          .expect(201);
      });
    });

    context('invalid data', () => {

    });
  });
});

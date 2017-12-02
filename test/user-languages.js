'use strict';

const path = require('path'),
      should = require('should'),
      sinon = require('sinon');

const agentFactory = require('./agent'),
      db = require('./db'),
      model = require(path.resolve('./model')),
      mailer = require(path.resolve('./services/mailer'));

describe('user-languages', () => {
  let agent,
      loggedUser,
      otherUser,
      sandbox;

  beforeEach(() => {
    agent = agentFactory();

    sandbox = sinon.sandbox.create();
    sandbox.useFakeTimers({
      now: Date.now(),
      toFake: ['Date']
    });
    // sandbox.spy(mailer, 'general');
    sandbox.stub(mailer, 'general');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('add and remove language from user', () => {
    describe('POST /users/:username/languages', () => {

      beforeEach(async () => {
        const dbData = await db.fill({
          users: 3,
          verifiedUsers: [0, 1],
          languages: ['cs', 'en', 'fi']
        });

        [loggedUser, otherUser] = dbData.users;
      });

      context('logged in as me', () => {

        beforeEach(() => {
          agent = agentFactory.logged({ username: loggedUser.username });
        });

        context('valid data', () => {

          it('201 and save to database', async () => {
            await agent
              .post(`/users/${loggedUser.username}/languages`)
              .send({
                data: {
                  type: 'user-languages',
                  attributes: {
                    level: 'intermediate'
                  },
                  relationships: {
                    language: {
                      data: {
                        type: 'languages',
                        id: 'cs'
                      }
                    }
                  }
                }
              })
              .expect(201);

            const languages = await model.languages.readUserLanguages(loggedUser.username);
            should(languages.length).eql(1);
            should(languages[0]).have.property('code2', 'cs');
          });
        });

        context('invalid data', () => {

          it('[nonexistent language] 404', async () => {
            await agent
              .post(`/users/${loggedUser.username}/languages`)
              .send({
                data: {
                  type: 'user-languages',
                  attributes: {
                    level: 'intermediate'
                  },
                  relationships: {
                    language: {
                      data: {
                        type: 'languages',
                        id: 'zz'
                      }
                    }
                  }
                }
              })
              .expect(404);
          });

          it('[nonexistent user] 404', async () => {
            await agentFactory.logged({ username: 'nonexistent-user' })
              .post('/users/nonexistent-user/languages')
              .send({
                data: {
                  type: 'user-languages',
                  attributes: {
                    level: 'intermediate'
                  },
                  relationships: {
                    language: {
                      data: {
                        type: 'languages',
                        id: 'cs'
                      }
                    }
                  }
                }
              })
              .expect(404);
          });

          it('[user-lang exists already] 409', async () => {
            await agent
              .post(`/users/${loggedUser.username}/languages`)
              .send({
                data: {
                  type: 'user-languages',
                  attributes: {
                    level: 'native'
                  },
                  relationships: {
                    language: {
                      data: {
                        type: 'languages',
                        id: 'cs'
                      }
                    }
                  }
                }
              })
              .expect(201);

            await agent
              .post(`/users/${loggedUser.username}/languages`)
              .send({
                data: {
                  type: 'user-languages',
                  attributes: {
                    level: 'beginner'
                  },
                  relationships: {
                    language: {
                      data: {
                        type: 'languages',
                        id: 'cs'
                      }
                    }
                  }
                }
              })
              .expect(409);
          });

          it('[invalid language code] 400', async () => {
            const response = await agent
              .post(`/users/${loggedUser.username}/languages`)
              .send({
                data: {
                  type: 'user-languages',
                  attributes: {
                    level: 'beginner'
                  },
                  relationships: {
                    language: {
                      data: {
                        type: 'languages',
                        id: '12'
                      }
                    }
                  }
                }
              })
              .expect(400);

            should(response.body).match({ errors: [{
              title: 'invalid language'
            }] });
          });

          it('[invalid language skill level] 400', async () => {
            const response = await agent
              .post(`/users/${loggedUser.username}/languages`)
              .send({
                data: {
                  type: 'user-languages',
                  attributes: {
                    level: 'incredible'
                  },
                  relationships: {
                    language: {
                      data: {
                        type: 'languages',
                        id: 'cs'
                      }
                    }
                  }
                }
              })
              .expect(400);

            should(response.body).match({ errors: [{
              title: 'invalid level'
            }] });
          });

          it('[missing language skill level] 400', async () => {
            const response = await agent
              .post(`/users/${loggedUser.username}/languages`)
              .send({
                data: {
                  type: 'user-languages',
                  attributes: {
                  },
                  relationships: {
                    language: {
                      data: {
                        type: 'languages',
                        id: 'cs'
                      }
                    }
                  }
                }
              })
              .expect(400);

            should(response.body).match({ errors: [{
              title: 'invalid properties',
              detail: 'missing property level'
            }] });
          });

          it('[additional attributes] 400', async () => {
            const response = await agent
              .post(`/users/${loggedUser.username}/languages`)
              .send({
                data: {
                  type: 'user-languages',
                  attributes: {
                    level: 'native',
                    additional: 'attribute'
                  },
                  relationships: {
                    language: {
                      data: {
                        type: 'languages',
                        id: 'cs'
                      }
                    }
                  }
                }
              })
              .expect(400);

            should(response.body).match({ errors: [{
              title: 'invalid property',
              detail: 'unexpected property'
            }] });
          });
        });
      });

      context('not logged in as me', () => {

        beforeEach(() => {
          agent = agentFactory.logged({ username: loggedUser.username });
        });

        it('403', async () => {
          await agent
            .post(`/users/${otherUser.username}/languages`)
            .send({
              data: {
                type: 'user-languages',
                attributes: {
                  level: 'intermediate'
                },
                relationships: {
                  language: {
                    data: {
                      type: 'languages',
                      id: 'cs'
                    }
                  }
                }
              }
            })
            .expect(403);
        });
      });
    });

    describe('DELETE /users/:username/languages/:lang', () => {

      beforeEach(async () => {
        const dbData = await db.fill({
          users: 3,
          verifiedUsers: [0, 1],
          languages: ['cs', 'en', 'fi'],
          userLanguages: [[0, 0, 1], [0, 1, 3], [1, 2, 2]]
        });

        [loggedUser, otherUser] = dbData.users;
      });

      context('logged in as me', () => {

        beforeEach(() => {
          agent = agentFactory.logged(loggedUser);
        });

        context('valid data', () => {

          it('204 and delete from database', async () => {

            // at the beginning user has 2 languages
            const before = await model.languages.readUserLanguages(loggedUser.username);
            should(before.length).eql(2);

            await agent
              .delete(`/users/${loggedUser.username}/languages/cs`)
              .expect(204);

            // after user has only 1 language
            const after = await model.languages.readUserLanguages(loggedUser.username);
            should(after.length).eql(1);
            should(after[0].code2).eql('en');
          });

        });

        context('invalid data', () => {

          it('[nonexistent user-lang] 404', async () => {
            await agent
              .delete(`/users/${loggedUser.username}/languages/fi`)
              .expect(404);
          });

          it('[invalid language code param] 400', async () => {
            const response = await agent
              .delete(`/users/${loggedUser.username}/languages/123`)
              .expect(400);

            should(response.body).match({ errors: [{
              title: 'invalid language'
            }] });
          });

        });
      });

      context('not logged in as me', () => {

        beforeEach(() => {
          agent = agentFactory.logged(loggedUser);
        });

        it('403', async () => {
          await agent
            .delete(`/users/${otherUser.username}/languages/fi`)
            .expect(403);
        });

      });
    });
  });
});

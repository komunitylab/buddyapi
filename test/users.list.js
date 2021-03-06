'use strict';

const should = require('should'),
      sinon = require('sinon');

const agentFactory = require('./agent'),
      db = require('./db');

/**
 * List buddies and comers
 * Filter by language, age, gender
 */

describe('list buddies and comers, filter', () => {
  let agent,
      dbData,
      sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.useFakeTimers({
      now: new Date('2017-12-31'),
      toFake: ['Date']
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    agent = agentFactory();
  });

  beforeEach(async () => {
    dbData = await db.fill({
      users: 12,
      verifiedUsers: [0, 1, 2, 3, 4, 5, 6, 7, 10, 11],
      details: [
        { gender: 'male' },
        { birthday: new Date('1993-07-13').getTime(), gender: 'female' }, // age 24
        { gender: 'female' },
        { birthday: new Date('1995-03-10').getTime(), gender: 'male' }, // age 22
        { gender: 'female' },
        { birthday: new Date('1994-11-01').getTime(), gender: 'other' }, // age 23
        { gender: 'female' },
        { birthday: new Date('1996-08-11').getTime(), gender: 'female' }, // age 21
        null, null,
        { available: false }, // not available buddy
        { available: false } // not available comer
      ],
      buddies: [0, 2, 4, 6, 8],
      active: [0, 2, 6],
      comers: [1, 3, 5, 7, 9],
      languages: ['ar', 'en', 'cs', 'sk'],
      userLanguages: [
        [1, 0, 1], [1, 2, 3], [3, 1, 0], [3, 2, 1], [5, 0, 3], [7, 3, 3],
        [0, 0, 1], [0, 1, 0], [2, 0, 2],
      ]
    });
  });

  describe('GET /comers', () => {

    context('logged as active buddy', () => {

      beforeEach(() => {
        agent = agentFactory.logged({
          role: 'buddy',
          active: true
        });
      });

      it('list comers (only verified and available)', async () => {
        const response = await agent
          .get('/comers')
          .expect(200);

        should(response.body).have.property('data').Array().length(4);
      });

      it('limit the list length', async () => {
        const response = await agent
          .get('/comers?page[offset]=1&page[limit]=2')
          .expect(200);

        should(response.body).have.property('data').Array().length(2);
        should(response.body.data[0].id).eql('user3');
        should(response.body.data[1].id).eql('user5');
      });

      it('show only given name', async () => {
        const response = await agent
          .get('/comers')
          .expect(200);

        const [user] = response.body.data;

        should(user).have.propertyByPath('attributes', 'givenName');
        should(user).not.have.propertyByPath('attributes', 'familyName');
      });

      it('show age in years', async () => {
        const response = await agent
          .get('/comers')
          .expect(200);

        const [user] = response.body.data;

        should(user).have.propertyByPath('attributes', 'age').eql(24);
        should(user).not.have.propertyByPath('attributes', 'birthday');
      });

      describe('?filter[gender]=male,female,other', () => {

        it('list only genders specified', async () => {
          const response = await agent
            .get('/comers?filter[gender]=other,female')
            .expect(200);

          const found = response.body.data;
          should(found.length).eql(3);
        });

      });

      describe('?filter[age][min]=123&filter[age][max]=456', () => {

        it('[age][min] show only older people, included', async () => {
          const response = await agent
            .get('/comers?filter[age][min]=22')
            .expect(200);

          const found = response.body.data;
          should(found.length).eql(3);
        });

        it('[age][max] show only younger people, included', async () => {
          const response = await agent
            .get('/comers?filter[age][max]=22')
            .expect(200);

          const found = response.body.data;
          should(found.length).eql(2);
        });

        it('[both] limit results from both sides', async () => {
          const response = await agent
            .get('/comers?filter[age][min]=22&filter[age][max]=23')
            .expect(200);

          const found = response.body.data;
          should(found.length).eql(2);
        });

      });

      describe('?filter[language]=aa,bb,cc', () => {
        it('[1 language] show only users who have the language', async () => {
          const response = await agent
            .get('/comers?filter[language]=ar')
            .expect(200);

          const found = response.body.data;
          should(found.length).eql(2);
        });

        it('[multiple language] show only users who have the language', async () => {
          const response = await agent
            .get('/comers?filter[language]=en,cs,ar')
            .expect(200);

          const found = response.body.data;
          should(found.length).eql(3);
        });

        it('sort outcome by language levels of searched languages', async () => {
          const response = await agent
            .get('/comers?filter[language]=en,cs,ar')
            .expect(200);

          const found = response.body.data;
          should(found.length).eql(3);

          // check that users are sorted by language levels
          // and languages of user also sorted by language levels
          should(found[0].id).eql(dbData.users[1].username);
          should(found[0].attributes).have.property('languages').deepEqual([
            { code2: 'cs', level: 'native' },
            { code2: 'ar', level: 'intermediate' }
          ]);

          should(found[1].id).eql(dbData.users[5].username);
          should(found[1].attributes).have.property('languages').deepEqual([
            { code2: 'ar', level: 'native' }
          ]);

          should(found[2].id).eql(dbData.users[3].username);
          should(found[2].attributes).have.property('languages').deepEqual([
            { code2: 'cs', level: 'intermediate' },
            { code2: 'en', level: 'beginner' }
          ]);
        });

      });
    });

    context('logged as inactive buddy', () => {
      beforeEach(() => {
        agent = agentFactory.logged({
          role: 'buddy',
          active: false
        });
      });

      it('403', async () => {
        await agent
          .get('/comers')
          .expect(403);
      });
    });

    context('logged as comer', () => {
      beforeEach(() => {
        agent = agentFactory.logged({
          role: 'comer'
        });
      });

      it('403', async () => {
        await agent
          .get('/comers')
          .expect(403);
      });
    });

    context('not logged', () => {
      it('403', async () => {
        await agent
          .get('/comers')
          .expect(403);
      });
    });
  });

  describe('GET /buddies', () => {

    context('logged in as comer', () => {

      beforeEach(() => {
        agent = agentFactory.logged({ role: 'comer' });
      });

      it('list verified, available, active buddies', async () => {
        const response = await agent
          .get('/buddies')
          .expect(200);

        should(response.body).have.property('data').Array().length(3);

        const [user] = response.body.data;

        should(user).have.propertyByPath('attributes', 'role');
        should(user).have.propertyByPath('attributes', 'gender');
      });

      it('show both given name and family name', async () => {
        const response = await agent
          .get('/buddies')
          .expect(200);

        const [user] = response.body.data;
        should(user).have.propertyByPath('attributes', 'givenName');
        should(user).have.propertyByPath('attributes', 'familyName');
      });

      it('all the filters work like GET /comers by active buddies', async () => {
        const response = await agent
          .get('/buddies?filter[gender]=female&filter[age][min]=22&filter[language]=ar')
          .expect(200);

        should(response.body).have.property('data').Array().length(1);
        const [user] = response.body.data;

        // user0 is male and user6 doesn't speak arabic, only user2 is a verified, available buddy which passes all the filters
        should(user).have.property('id').eql(dbData.users[2].username);

        should(user).have.propertyByPath('attributes', 'languages').match([{
          code2: 'ar',
          level: 'advanced'
        }]);
      });

    });

    context('logged in as buddy', () => {
      it('403', async () => {
        await agentFactory.logged({ role: 'buddy', active: 'true' })
          .get('/buddies')
          .expect(403);
      });
    });

    context('not logged', () => {
      it('403', async () => {
        await agentFactory()
          .get('/buddies')
          .expect(403);
      });
    });
  });
});

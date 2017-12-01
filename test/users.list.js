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
    await db.fill({
      users: 10,
      verifiedUsers: [0, 1, 2, 3, 4, 5, 6, 7],
      details: [
        null,
        { birthday: '1993-07-13', gender: 'female' }, // age 24
        null,
        { gender: 'male' },
        null,
        { gender: 'other' },
        null,
        { gender: 'female' },
      ],
      buddies: [0, 2, 4, 6, 8],
      active: [0, 2, 6],
      comers: [1, 3, 5, 7, 9]
    });
  });

  describe('GET /comers', () => {

    context('logged as buddy', () => {

      beforeEach(() => {
        agent = agentFactory.logged({
          role: 'buddy',
          active: true
        });
      });

      it('list comers', async () => {
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
        it('[age][min] show only older people, included');
        it('[age][max] show only younger people, included');

        it('[both] limit results from both sides');
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

  });
});

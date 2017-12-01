'use strict';

const jwt = require('jsonwebtoken'),
      _ = require('lodash'),
      path = require('path'),
      defaults = require('superagent-defaults'),
      supertest = require('supertest'),
      app = require(path.resolve('./app')),
      jwtConfig = require(path.resolve('./config')).jwt;

/**
 * Factory of supertest agent, which is able to accept default settings (headers, auth etc).
 * You can set more defaults by executing .set(headers) on the returned value (the agent).
 * @param {boolean} [includeDefaults=true] - Should we include some default headers (content-type, accept)?
 * @returns {object} - the agent, more default values can be set on it
 *
 */
function agentFactory(includeDefaults = true) {
  const agent = defaults(supertest(app));

  if (includeDefaults === true) {
    agent
      .set({
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      });
  }

  return agent;
}

function loggedAgentFactory(user = {}, includeDefaults = true) {
  const agent = agentFactory(includeDefaults);

  // create token
  const defaultPayload = { username: 'logged-user', verified: true };
  const payload = Object.assign(defaultPayload, _.pick(user, ['username', 'verified', 'role', 'active', 'admin']));

  const token = jwt.sign(payload, jwtConfig.secret, {
    algorithm: 'HS256',
    expiresIn: (payload.admin) ? jwtConfig.adminExpirationTime : jwtConfig.expirationTime
  });

  agent.set('Authorization', `Bearer ${token}`);

  return agent;
}

agentFactory.logged = loggedAgentFactory;

module.exports = agentFactory;

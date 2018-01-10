# buddyapi

[![Build Status](https://api.travis-ci.org/komunitylab/buddyapi.svg?branch=master)](https://travis-ci.org/komunitylab/buddyapi)

The purpose of this API is to connect people fluent in local language (Buddies) with people, who don't know the local language and want to learn it (Comers). Created for Brno, Czech Republic.

## tech stack

- nodejs
- expressjs
- MySQL

## prerequisities

- nodejs version 8+
- npmjs
- MySQL running on port 3306

## install

- clone this repository
- go to this repository's folder
- run `npm install`
- `cp ./config/secret/sample.js ./config/secret/development.js`
- `cp ./config/secret/sample.js ./config/secret/test.js`
- open `./config/secret/development.js` and `./config/secret/test.js` and edit database password and jwt secret. Choose good, strong values. This is particularly important in production.
- you can edit other config files, too
- set up development database with `NODE_ENV=development npm run init-db`
- set up database for tests with `NODE_ENV=development npm run init-db`

## run

```
npm start
```

## test

```
npm test
```

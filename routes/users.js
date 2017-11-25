const express = require('express'),
      path = require('path');

const controllers = require(path.resolve('./controllers'));
const validators = require(path.resolve('./validators'));

const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  res.json({});
});

/**
 * Create a new user
 */

router.route('/')
  .post(validators.users.post, controllers.users.create);

module.exports = router;

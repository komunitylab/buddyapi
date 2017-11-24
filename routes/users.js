const express = require('express'),
      path = require('path');

const controllers = require(path.resolve('./controllers'));

const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  res.json({});
});

/**
 * Create a new user
 */

router.route('/')
  .post(controllers.users.create);

module.exports = router;

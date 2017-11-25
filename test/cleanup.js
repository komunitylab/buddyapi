const path = require('path'),
      pool = require(path.resolve('./model/db'));

after(async () => {
  await pool.end();
});

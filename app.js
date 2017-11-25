const express = require('express'),
      bodyParser = require('body-parser');

const users = require('./routes/users'),
      deserialize = require('./controllers/deserialize');

const app = express();

app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

// set content type to jsonapi
app.use((req, res, next) => {
  res.contentType('application/vnd.api+json');
  next();
});

app.use(deserialize);

app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// validation error handler
app.use(require('./validators/errorHandler'));

app.use(function(err, req, res, next) { // eslint-disable-line no-unused-vars
  // set locals, only providing error in development
  res.locals.message = err.message;

  console.error(err); // eslint-disable-line no-console

  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({});
});

module.exports = app;

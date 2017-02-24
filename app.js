//Load modules
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var messages= require('./routes/messages');

// load mongoose package
var mongoose = require('mongoose');

// Use native Node promises
mongoose.Promise = global.Promise;

// connect to MongoDB
//// for MongoDB by Bluemix Compose service
if (process.env.VCAP_SERVICES) {
  var env = JSON.parse(process.env.VCAP_SERVICES);
  if (env['compose-for-mongodb']) { // for Compose
	  console.log('Reading VCAP credentials for mongoDB');
      var cm = env['compose-for-mongodb'][0].credentials;  
	  var ca = [new Buffer(cm.ca_certificate_base64, 'base64')];
	  var uri = cm.uri.split(',')[0]+'/admin?ssl=true';//Note : doesn't work with the 2 hostnames
	  mongoose.connect(uri, {
	    server: {
	      ssl: true,
	      sslValidate: true,
	      sslCA: ca,
	      poolSize: 1,
	      reconnectTries: 1
	    }
	  }).then(() =>  console.log('bluemix connection succesful'))
	  .catch((err) => console.error('error connecting to bluemix '+cm.uri+' : '+err));
  }
}else{////FOR LOCAL
	  var dbURI = 'mongodb://admin:VBEENYCXOMKTJUIV@bluemix-sandbox-dal-9-portal.1.dblayer.com:23203:23203/admin?ssl=true';
	  mongoose.connect(dbURI, {
			  server: {sslValidate: false}
	  })
	  	  .then(() =>  console.log('local connection succesful'))
		  .catch((err) => console.error('error connecting to local '+dbURI+' : '+err));
}



//setup app
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/messages', messages);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
console.log('env:',app.get('env'));

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
	console.log(err);
	res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

/**
 * http://usejsdoc.org/
 */

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
	  console.log('mongoDB:Connecting');
	  mongoose.connect(uri, {
	    server: {
	      ssl: true,
	      sslValidate: true,
	      sslCA: ca,
	      poolSize: 1,
	      reconnectTries: 1
	    }
	  }).then(() =>  console.log('mongoDB:Connected'))
	  .catch((err) => console.error('error connecting to bluemix '+cm.uri+' : '+err));
  }
}
//}else{////FOR LOCAL
//	  var dbURI = 'mongodb://admin:VxxV@bluemix-sandbox-dal-9-portal.1.dblayer.com:23203:23203/admin?ssl=true';
//	  mongoose.connect(dbURI, {
//			  server: {sslValidate: false}
//	  })
//	  	  .then(() =>  console.log('local connection succesful'))
//		  .catch((err) => console.error('error connecting to local '+dbURI+' : '+err));
//}
module.exports = mongoose;
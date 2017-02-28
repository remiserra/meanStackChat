// prepare access to IBM Graph DB
var request = require('request'); /* Note: using promise-friendly lib */

//get credentials
if (process.env.VCAP_SERVICES) {//for bluemix
  var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
  var graphService = 'IBM Graph';
  if (vcapServices[graphService] && vcapServices[graphService].length > 0) {
	console.log('Reading VCAP credentials for',graphService);
    var tp3 = vcapServices[graphService][0];
    //apiURL = tp3.credentials.apiURL;
    var username = tp3.credentials.username;
    var password = tp3.credentials.password;
    var apiURI = tp3.credentials.apiURI;//apiURL.split('/g').join('');     
	var apiURL = apiURI + '/gchat';
	module.exports.apiURL = apiURL;

	// Get session token
	console.log('GraphDB:Connecting');
	var getTokenOpts = {
	    method: 'GET',
	    uri: apiURI + '/_session',
	    auth: {user: username, pass: password},
	    json: true
	};
	
	request(getTokenOpts,function (err,resp,body) {
		if (err) console.log(err);
	    var sessionToken = 'gds-token ' + body['gds-token'];
	    console.log('GraphDB:Token:',sessionToken.substring(0,20),'...');
	    module.exports.sessionToken = sessionToken;	    
	//SCHEMA ALREADY CREATED
		if(false){
			// init graph schema
			var fs = require('fs');
			//note : path is relative to project root dir
			fs.readFile('./lib/graphSchema.json', 'utf-8',function(err,data){
				if (err) throw err;
				console.log("schema:",data);
			    //Now send the request to IBM Graph
			    var postSchemaOpts = {
			        method: 'POST',
			        //auth: {user: username, pass: password},
			        headers: {'Authorization': sessionToken},
			        uri: apiURL + '/schema',
			        json: JSON.parse(data.toString())
			    };
			    request(postSchemaOpts,function (err,resp,body) {
			    	if (err) console.log(err);
			    	console.log('Created schema:',body);
			    });
			});
		}
	});
  }
}

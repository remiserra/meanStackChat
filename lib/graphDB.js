// prepare access to IBM Graph DB
var request = require('request'); /* Note: using promise-friendly lib */

//get credentials

//FOR LOCAL
//var apiURL = 'https://ibmgraph-alpha.ng.bluemix.net/b853346f-a969-46e7-ae8b-e26487ec3357/g';
var username = 'e27526af-3ce6-4325-a40d-1f25791f8e35';
var apiURI = 'https://ibmgraph-alpha.ng.bluemix.net/b853346f-a969-46e7-ae8b-e26487ec3357';
var password = '57312055-204e-4665-ad9f-a5b0e96ff2c6';	
if (process.env.VCAP_SERVICES) {//for bluemix
  var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
  var graphService = 'IBM Graph';
  if (vcapServices[graphService] && vcapServices[graphService].length > 0) {
    var tp3 = vcapServices[graphService][0];
    //apiURL = tp3.credentials.apiURL;
    username = tp3.credentials.username;
    password = tp3.credentials.password;
    apiURI = tp3.credentials.apiURI;//apiURL.split('/g').join('');     
  }
}
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
    console.log('GraphDB:Token:',sessionToken);
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
		    	console.log('Successfully created schema and here is the response : ',body);
		    });
		});
	}
});


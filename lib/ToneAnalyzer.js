//Connect to watson tone analyzer
var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
if (process.env.VCAP_SERVICES) {
	  var env = JSON.parse(process.env.VCAP_SERVICES);
	  if (env['tone_analyzer']) { // for Compose
		  console.log('Reading VCAP credentials for Tone Analyzer');
		  var cm = env['tone_analyzer'][0].credentials;
		  // Create the service wrapper
		  var toneAnalyzer = new ToneAnalyzerV3({
		    // If unspecified here, the TONE_ANALYZER_USERNAME and TONE_ANALYZER_PASSWORD environment properties will be checked
		    // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
		    username: cm.username,
		    password: cm.password,
		    version_date: '2016-05-19'  	
		  });
		  module.exports = toneAnalyzer;
	  }
}

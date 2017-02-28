//Connect to watson translator (was watson translation)
var LanguageTranslatorV2 = require('watson-developer-cloud/language-translator/v2');

if (process.env.VCAP_SERVICES) {
	  var env = JSON.parse(process.env.VCAP_SERVICES);
	  if (env['language_translator']) { // for Compose
		  console.log('Reading VCAP credentials for Language Translator');
		  var cm = env['language_translator'][0].credentials;
		  // Create the service wrapper
		  var languageTranslator = new LanguageTranslatorV2({
			  username: cm.username,
			  password: cm.password,
			  url: cm.url
		  });
		  module.exports = languageTranslator;
	  }
}

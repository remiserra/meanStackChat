//Connect to watson translator (was watson translation)
var LanguageTranslatorV2 = require('watson-developer-cloud/language-translator/v2');
var languageTranslator = new LanguageTranslatorV2({//FOR LOCAL
	username: '843bc2f1-daba-4249-b06e-3f9c367b4772',
	password: 'TwqXTGj4SL22',
	url : 'https://gateway.watsonplatform.net/language-translator/api'
});
if (process.env.VCAP_SERVICES) {
	  var env = JSON.parse(process.env.VCAP_SERVICES);
	  if (env['language_translator']) { // for Compose
		  console.log('Reading VCAP credentials for Language Translator');
		  var cm = env['language_translator'][0].credentials;
		  // Create the service wrapper
		  languageTranslator = new LanguageTranslatorV2({
			  username: cm.username,
			  password: cm.password,
			  url: cm.url
		  });
	  }
}

module.exports = languageTranslator;

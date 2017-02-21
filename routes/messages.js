// Handle REST API 
var express = require('express');
var router = express.Router();
//Message is my mongoose model for the messages collection
//Here we translate the REST calls to the 'messages' endpoint to actions on the collection via mongoose
var Message = require('../models/Message.js');

/* GET /messages listing. */
router.get('/', function(req, res, next) {
	//console.log('message:GET:/:query:', req.query);
	var cond={ 'to':'ALL'};
	if(undefined != req.query.user){
		//console.log('message:GET:user:'+req.query.user);
		cond= { $or:[ {'from':req.query.user}, {'to':req.query.user} ]};
	}
	Message.find(cond,function (err, messages) {
    if (err) return next(err);
    res.json(messages);
  });
});

//Connect to watson tone analyzer
var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
//default for local
var toneAnalyzer = new ToneAnalyzerV3({
 username: "user",
 password: "pass",
 version_date: '2016-05-19'
});
if (process.env.VCAP_SERVICES) {
	  var env = JSON.parse(process.env.VCAP_SERVICES);
	  if (env['tone_analyzer']) { // for Compose
		  console.log('Reading VCAP credentials for Tone Analyzer');
		  var cm = env['compose-for-mongodb'][0].credentials;
		  // Create the service wrapper
		  toneAnalyzer = new ToneAnalyzerV3({
		    // If unspecified here, the TONE_ANALYZER_USERNAME and TONE_ANALYZER_PASSWORD environment properties will be checked
		    // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
		    username: cm.username,
		    password: cm.password,
		    version_date: '2016-05-19'
		  });
	  }
}



/* POST /messages */
router.post('/', function(req, res, next) {
  console.log('messages:POST:/:req.body',req.body);
  //perform tone analyzer
  //test via https://watson-api-explorer.mybluemix.net/tone-analyzer/api/v3/tone?version=2016-05-19&text=Hello%20World%20
  toneAnalyzer.tone({text:req.body.text}, function(err, data) {
	    if (err) return next(err);
	    var sentiments = data.document_tone.tone_categories.filter(function (x) { return x.category_id==='emotion_tone'; })[0].tones.sort(function(a,b) { return b.score>a.score; });
	    var sentimentsText = sentiments.map(function (x) {return x.tone_id + ':' + x.score;});
	    var sentiment = sentiments[0].tone_name;
	    console.log('messages:POST:sentimentsText:',sentimentsText);	    
	    var smiley = '';
	    switch(sentiment) {
		    case 'Anger':
		    	smiley='>:';
		    	break;
		    case 'Disgust':
		    	smiley=':$';
		    	break;
		    case 'Fear':
		    	smiley=':O';
		    	break;
		    case 'Joy':
		    	smiley=':)';
		    	break;
		    case 'Sadness':
		    	smiley=':(';
		        break;
		    default:
		    	smiley=':|';
		}	    
	    var toInsert = { from: req.body.from, to: req.body.to, text: req.body.text, tone: smiley };
	    Message.create(toInsert, function (err, post) {
	        if (err) return next(err);
	        res.json(post);//return what was inserted
	      });
	  });
});

/* GET /messages/:id to get a particular message */
router.get('/:id', function(req, res, next) {
	//console.log('messages:GET:id:'+req.params.id)
	Message.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* GET /messages/user/:user to get messages for a particular user */
// UNUSED as the express routing doesn't do that easily, see the get/?user= endpoint
router.get('/user/:user', function(req, res, next) {
	//console.log('messages:GET:user:'+req.params.user)
	Message.find( { $or:[ {'from':req.params.user}, {'to':req.params.user} ]}, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* PUT /messages/:id for updates*/
router.put('/:id', function(req, res, next) {
	//console.log('messages:PUT:id')
	var options = {
			w: 'majority'
	    };
	Message.findByIdAndUpdate(req.params.id, req.body, options, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* DELETE /messages/:id */
router.delete('/:id', function(req, res, next) {
	//console.log('messages:DELETE:id:',req.params.id);
	var options = {
	        w: 'majority'
	    };
	Message.findByIdAndRemove(req.params.id, options, function (err) {
	if (err) return next(err);
    res.end();//return empty response
  });
//	console.log('doing nothing');
});

module.exports = router;

// Handle REST API
var express = require('express');
var router = express.Router();
//Message is my mongoose model for the messages collection
//Here we translate the REST calls to the 'messages' endpoint to actions on the collection via mongoose
var Message = require('../models/Message.js');
var toneAnalyzer = require('../lib/ToneAnalyzer.js');
var languageTranslator = require('../lib/LanguageTranslator.js');
var graphDB = require('../lib/graphDB.js');
var request = require('request');
		
/* GET /messages listing. */
router.get('/', function(req, res, next) {
	//console.log('message:GET:/:query:', req.query);
	var cond={ 'to':'ALL'};
	if(undefined != req.query.user){
		//console.log('message:GET:user:'+req.query.user);
		cond= { $or:[ {'from':req.query.user}, {'to':req.query.user} ]};
	}
	if('ADMIN' === req.query.user){
		cond={};
	}
	Message.find(cond,function (err, messages) {
	    if (err) return next(err);
	    res.json(messages);
	  });
});

function extractSentiment(jsonData){
    var sentiments = jsonData.document_tone.tone_categories.filter(function (x) { return x.category_id==='emotion_tone'; })[0].tones.sort(function(a,b) { return b.score>a.score; });
    var sentimentsText = sentiments.map(function (x) {return x.tone_id + ':' + x.score;});
    //console.log('messages:POST:sentimentsText:',sentimentsText);
    var sentiment = sentiments[0].tone_name;
    return sentiment;
}

function getToneAndInsert(req,res,next,translatedText){
	toneAnalyzer.tone({text:translatedText}, function(err, sentimentData) { 
		//console.log('messages:POST:/:getToneAndInsert:err:',err);
		if (err) return next(err);
	    var sentiment = extractSentiment(sentimentData);	   
	    console.log('messages:POST:/:sentiment:',sentiment);
	    var toInsert = { from: req.body.from, to: req.body.to, text: req.body.text, translation: translatedText, tone: sentiment };
	    //insert in mongo DB
	    Message.create(toInsert, function (err, post) {
	        if (err) return next(err);
	        res.json(post);
	    });
	    //Add in our graphDB
	    putInGraphDB(req, sentiment);
	});
}

function createVertexPerson(name,then){
	//check if exists
	request.get({
	    headers: {'Authorization': graphDB.sessionToken},
	    uri: graphDB.apiURL + '/vertices?label=person&name='+name,
	    },function (err,resp,body) {
	    	if (err) console.log(err);
	    	var body = JSON.parse(body);//here if I don't parse it doesnt work
	    	//console.log('body',body);
	    	if(body.result.data.length === 0){
	    		var personJson = {'label':'person','properties':{'name':name}};
	    		console.log('GraphDB:personJson:',personJson);
	    		//create
	    		request.post({
	    		    headers: {'Authorization': graphDB.sessionToken},
	    		    uri: graphDB.apiURL + '/vertices',
	    		    json: personJson},function (err,resp,body) {
	    				if (err) console.log(err);
	    				console.log('GraphDB:Vertex:Created:',body.result.data);//Here the body seems to be already parsed
	    			    vertex1 = body.result.data[0].id;
	    			    then(vertex1);
	    			});
	    	}else{
	    		console.log('GraphDB:Vertex:Existing:',body.result.data);
	    		vertex1 = body.result.data[0].id;	
	    		then(vertex1);
	    	}	    	
	});	
} 

function createEdgeMessage(vFrom,vTo,text,tone){
	var body = {
	        'outV': vFrom,
	        'inV': vTo,
	        'label': 'message',
	        'properties': {
		        'time': Date.now(),
		        'tone': tone,
		        'text': text
		    }
	    };
    var postEdgeOpts = {
        method: 'POST',
        headers: {'Authorization': graphDB.sessionToken},
        uri: graphDB.apiURL + '/edges',
        json: body
    };
    //console.log('postEdgeOpts',postEdgeOpts);
	request(postEdgeOpts,function (err,res,body) {
		if (err) console.log(err);
		//console.log(body);
		console.log('GraphDB:Edge:',body.result.data);
		//var edge1 = JSON.parse(body).result.data[0].id;
	});
}

function putInGraphDB(req,tone){
	//console.log('graphDB:',graphDB);
	createVertexPerson(req.body.from,function(vFrom){
		createVertexPerson(req.body.to,function(vTo){
			createEdgeMessage(vFrom,vTo,req.body.text,tone);
		});
	});
}

/* POST /messages */
router.post('/', function(req, res, next) {
  console.log('messages:POST:/:req.body',req.body);
  //detect language see https://www.ibm.com/watson/developercloud/language-translator/api/v2/
  languageTranslator.identify({ text: req.body.text}, function(err, identifiedLanguages) {
		if (err) return next(err);
		//console.log('messages:POST:/:identifiedLanguages:',identifiedLanguages);		
		var detectedLanguage = identifiedLanguages.languages[0].language;
		console.log('messages:POST:/:detectedLanguage:',detectedLanguage);
		if(detectedLanguage === 'fr' || detectedLanguage==='es' ||detectedLanguage=='pt'||detectedLanguage=='at'){//Filter on translatable languages only
			//translate to english	    
			languageTranslator.translate({ text: req.body.text, source: detectedLanguage, target: 'en' }, function(err, translationData) {
		      if (err) return next(err);
		      //console.log('messages:POST:/:translationData:', translationData);
		      var translatedText = translationData.translations[0].translation;
		      console.log('messages:POST:/:translatedText:', translatedText);
		      //perform tone analyzer //test via https://watson-api-explorer.mybluemix.net/tone-analyzer/api/v3/tone?version=2016-05-19&text=Hello%20World%20
		      getToneAndInsert(req,res,next, translatedText);
			});
		}else{//english or unsupported
			getToneAndInsert(req,res,next, req.body.text);
		}
  });
});

/* GET /messages/:id to get a particular message */
// UNUSED
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

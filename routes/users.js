var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, response, next) {
	//TODO list users 
	response.send('Sorry, we are out of users for the moment.');
});

module.exports = router;

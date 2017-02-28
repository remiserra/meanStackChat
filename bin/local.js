// For local execution, run from here instead of www
// still list www as startpoing in package.json
/** Read LOCAL VCAP if needed **/
if (!process.env.VCAP_SERVICES) {
	//load local env if needed
	console.log('Loading VCAP_SERVICES from local file');
	process.env.VCAP_SERVICES = require('C:/_MY_DOCS/BlueMix/Dev/VCAP_SERVICES.js');	//should contain the credentials as a json string : module.exports='{$VCAP_SERVICES}';
}else{
	console.log('VCAP_SERVICES already defined');
}
var bin=require('./www');

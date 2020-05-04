var apiV1 = require("./v1");
var apiV2 = require("./v2");


module.exports = function(app,BASE_PATH){
	apiV1(app1,BASE_PATH+"/v1");
	apiV2(app2,BASE_PATH+"/v2");
}


/*module.exports = function(app,BASE_PATH){
	apiV2(app2,BASE_PATH+"/v2");
}*/
var api1 = require("./v1");
var api2 = require("./v2");


module.exports = function(app,BASE_PATH){
	api1(app,BASE_PATH+"/v1");
	api2(app,BASE_PATH+"/v2");
}
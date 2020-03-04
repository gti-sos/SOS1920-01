const express = require ("express");
var app = express();

var time = require("time");
var now = new time.Date();


now.setTimezone("UTC-1");

app.get("/time",(request,response) => {
	response.send("<html>"+now.toString()+"</html>");
});

app.listen(80);

console.log("Server already");

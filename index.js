const express = require ("express");
var app = express();

var time = require("time");
var now = new time.Date();

now.setTimezone("America/Los_Angeles");

app.get("/time",(request,response) => {
	response.send("<html>"+time+"</html>");
});

app.listen(80);

console.log("Server already");

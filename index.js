const express = require ("express");
var app = express();

var port = process.env.PORT || 80;

app.use("/",express.static("./public")); 

//var time = require("time");
var now = new time.Date();


now.setTimezone("UTC-1");

app.get("/public",(request,response) => {
	response.send(index.html);
});

app.listen(port);

console.log("Server already");

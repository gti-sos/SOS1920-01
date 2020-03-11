const express = require ("express");
var app = express();

app.use("/",express.static("./public")); 

var time = require("time");
var now = new time.Date();


now.setTimezone("UTC-1");

app.get("/public",(request,response) => {
	response.send(index.html);
});

app.listen(80);

console.log("Server already");

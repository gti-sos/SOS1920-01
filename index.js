const express = require ("express");
var app = express();

app.use("/",express.static("./public")); 


var port = process.env.PORT || 80;

now.setTimezone("UTC-1");

app.get("/public",(request,response) => {
	response.send(index.html);
});

app.listen(port,() => {
	
		console.log("Server start");
	
	});
console.log("Starting server...");

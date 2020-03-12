const express = require ("express");
var app = express();

app.use("/",express.static("./public")); 

var port = process.env.PORT || 80;

app.get("/public",(request,response) => {
	response.send("index.html");
});

app.listen(port);

console.log("Server already");
app.listen(port,() => {
	
		console.log("Server start");
	
	});

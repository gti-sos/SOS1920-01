const express = require ("express");
const bodyParser = require("bodyParser");

var app = express();

app.use("/",express.static("./public")); 
app.use(bodyParser.json());

var port = process.env.PORT || 80;

app.get("/public",(request,response) => {
	response.send("index.html");
});

app.listen(port,() => {
	
		console.log("Server start");
	
	});
console.log("Starting server...");

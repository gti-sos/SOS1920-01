const express = require ("express");
const bodyParser = require("body-parser");
const dataStore = require("nedb");
const path = require("path");
const BASE_PATH = "/api";
const dbFileName = path.join(__dirname,"poverty-stats.db");
const db = new dataStore({
	filename: dbFileName,
	autoload:true
});

var path = require("path");
var app = express();
var port = process.env.PORT || 80;

//app.use("/",express.static("./public")); 

app.use(bodyParser.json());

app.get("/public",(request,response) => {
	response.send("index.html");
});

var api_angela= require("./api-angela");
api_angela(app, BASE_PATH);




 // ---------------- SERVIDOR ----------------
console.log("Server already");
app.listen(port,() => {
		console.log("Server start");
});


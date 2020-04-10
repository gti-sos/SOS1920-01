const express = require ("express");
const bodyParser = require("body-parser");
const BASE_PATH = "/api";
const path = require("path");
const app = express();
const port = process.env.PORT || 80;

app.use("/",express.static("./public")); 
app.use(bodyParser.json());

app.get("/public",(request,response) => {
	response.send("index.html");
});


//////////////////// Antonio Escobar Núñez ////////////////////
var apiEscobar = require("./api-escobar");
apiEscobar(app,BASE_PATH);

//////////////////// Servidor ////////////////////

console.log("Server already");
app.listen(port,() => {
		console.log("Server start");
});


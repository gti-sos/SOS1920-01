const express = require ("express");
const bodyParser = require("bodyParser");

var app = express();

app.use("/",express.static("./public")); 
app.use(bodyParser.json());

var port = process.env.PORT || 80;
var BASE_API_USE = "/api/v1";

app.get("/public",(request,response) => {
	response.send("index.html");
});
/////////URL////////////////

	
////////////////////////////
///////////DATOS////////////
////////////////////////////
	
var emigrants_stats = [
	
	{country: "italy",year: "2017",em_man:"1588733", em_woman:"1440435",em_total: "3029168"},
	{country: "spain",year: "2017",em_man:"609615", em_woman:"736247",em_total: "1345862"},
	{country: "germany",year: "2017",em_man:"1934294", em_woman:"2273789",em_total: "4208083"},
	{country: "united kingdom",year: "2017",em_man:"2449446", em_woman:"2471863",em_total: "4921309"},
	{country: "france",year: "2017",em_man:"1068275", em_woman:"1138938",em_total: "2207213"},
	
	{country: "italy",year: "2015",em_man:"1416897", em_woman:"1275167",em_total: "2692064"},
	{country: "spain",year: "2015",em_man:"579112", em_woman:"691908",em_total: "1271020"},
	{country: "germany",year: "2015",em_man:"1749064", em_woman:"2007072",em_total: "3756136"},
	{country: "united kingdom",year: "2015",em_man:"2048936", em_woman:"1979345",em_total: "4028281"},
	{country: "france",year: "2015",em_man:"1033824", em_woman:"1101224",em_total: "2135048"},
	
	{country: "italy",year: "2010",em_man:"1332956", em_woman:"1230383",em_total: "2563339"},
	{country: "spain",year: "2010",em_man:"489494", em_woman:"597058",em_total: "1086552"},
	{country: "germany",year: "2010",em_man:"1734554", em_woman:"1992779",em_total: "3727333"},
	{country: "united kingdom",year: "2010",em_man:"2237000", em_woman:"2213254",em_total: "4450254"},
	{country: "france",year: "2010",em_man:"943996", em_woman:"1013973",em_total: "1957969"}
	
];
	              

///////////////////////////
////////POSTMAN GET////////
///////////////////////////

app.get(BASE_API_USE+"/emigrants_stats",(req,res) =>{
	
	res.send(JSON.stringify(emigrants_stats,null,2));
});





/////////////////////////
///////SERVIDOR////////
app.listen(port,() => {
	
		console.log("Server start");
	
	});
console.log("Starting server...");

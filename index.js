const express = require ("express");
const bodyParser = require("body-parser");

var app = express();

app.use("/",express.static("./public")); 
app.use(bodyParser.json());

var port = process.env.PORT || 80;
var BASE_API_USE = "/api/v1";

app.get("/public",(request,response) => {
	response.send("index.html");
});
	
////////////////////////////
///////////DATOS////////////
////////////////////////////
	
var emigrants_stats = [
	
	{country:"italy",year:2017,em_man:1588733,em_woman:1440435,em_totals:3029168},
	{country:"spain",year:2017,em_man:609615,em_woman:736247,em_totals:1345862},
	{country:"germany",year:2017,em_man:1934294,em_woman:2273789,em_totals:4208083},
	{country:"united kingdom",year:2017,em_man:2449446,em_woman:2471863,em_totals:4921309},
	{country:"france",year:2017,em_man:1068275,em_woman:1138938,em_totals:2207213},
	
	{country:"italy",year:2015,em_man:1416897,em_woman:1275167,em_totals:2692064},
	{country:"spain",year:2015,em_man:579112,em_woman:691908,em_totals:1271020},
	{country:"germany",year:2015,em_man:1749064,em_woman:2007072,em_totals:3756136},
	{country:"united kingdom",year:2015,em_man:2048936,em_woman:1979345,em_totals:4028281},
	{country:"france",year:2015,em_man:1033824,em_woman:1101224,em_totals:2135048},
	
	{country:"italy",year:2010,em_man:1332956,em_woman:1230383,em_totals:2563339},
	{country:"spain",year:2010,em_man:489494,em_woman:597058,em_totals:1086552},
	{country:"germany",year:2010,em_man:1734554,em_woman:1992779,em_totals:3727333},
	{country:"united kingdom",year:2010,em_man:2237000,em_woman:2213254,em_totals:4450254},
	{country:"france",year:2010,em_man:943996,em_woman:1013973,em_totals:1957969}
	
];

/////////////////////////////////
/////////LoadInitialData/////////
/////////////////////////////////

//GET /api/v1/emigrants-stats-/loadInitialData
app.get(BASE_API_USE+"/emigrants-stats/loadInitialData", (req, res) => {		
		var emigrants_stats = [
		{country:"italy",year:2017,em_man:1588733,em_woman:1440435,em_totals:3029168},
		{country:"spain",year:2017,em_man:609615,em_woman:736247,em_totals:1345862},
		{country:"germany",year:2017,em_man:1934294,em_woman:2273789,em_totals:4208083},
		{country:"united kingdom",year:2017,em_man:2449446,em_woman:2471863,em_totals:4921309},
		{country:"france",year:2017,em_man:1068275,em_woman:1138938,em_totals:2207213},
	
		{country:"italy",year:2015,em_man:1416897,em_woman:1275167,em_totals:2692064},	
		{country:"spain",year:2015,em_man:579112,em_woman:691908,em_totals:1271020},
		{country:"germany",year:2015,em_man:1749064,em_woman:2007072,em_totals:3756136},
		{country:"united kingdom",year:2015,em_man:2048936,em_woman:1979345,em_totals:4028281},
		{country:"france",year:2015,em_man:1033824,em_woman:1101224,em_totals:2135048},
	
		{country:"italy",year:2010,em_man:1332956,em_woman:1230383,em_totals:2563339},
		{country:"spain",year:2010,em_man:489494,em_woman:597058,em_totals:1086552},
		{country:"germany",year:2010,em_man:1734554,em_woman:1992779,em_totals:3727333},
		{country:"united kingdom",year:2010,em_man:2237000,em_woman:2213254,em_totals:4450254},
		{country:"france",year:2010,em_man:943996,em_woman:1013973,em_totals:1957969}
	
		];
		
		res.sendStatus(201,"Created");
	
});
///////////////////////////
////////POSTMAN GET////////
///////////////////////////

//////////////////////////////////////////////////////////////// GET /api/v1/emigrants-stats
app.get(BASE_API_USE+"/emigrants-stats",(req,res) =>{
	
	res.send(JSON.stringify(emigrants_stats,null,2));
});

//////////////////////////////////////////////////////////////// GET /api/v1/emigrants-stats/country
app.get(BASE_API_USE+"/emigrants-stats/:country", (req,res) => {
    var country = req.params.country;
	
	var emigrants = emigrants_stats.filter((e) => {return (e.country == country);});
	
	
	if(emigrants.length >= 1){
		res.send(emigrants);
	}else{
		res.sendStatus(404,"Not found");
	}
});
//////////////////////////////////////////////////////////////// GET /api/v1/emigrants-stats/country/year
app.get(BASE_API_USE+"/emigrants-stats/:country/:year", (req,res) => {
    var country = req.params.country;
	var year = req.params.year;
	
	var emigrantsC = emigrants_stats.filter((c) => {return (c.country == country);});
	
	var emigrantsY = emigrants_stats.filter((y) => {return(y.year == year);});
	
	
	if(emigrantsC.length >= 1 && emigrantsY.length >=1){
		var sol = emigrantsC.filter((s) => {return(s.year == year);});
		res.send(sol);
	}else{
		res.sendStatus(404,"Not found");
	}
});

///////////////////////////
////////POSTMAN POST///////
///////////////////////////

//////////////////////////////////////////////////////// POST /api/v1/pollution-stats
app.post(BASE_API_USE+"/emigrants-stats", (req,res) => {
    var newStat = req.body;
	
	if ((newStat== "") || (newStat.country==null) || (newStat.year==null) || 
        (newStat.em_man==null) || (newStat.em_woman==null) || (newStat.em_totals==null)){
	   
		res.sendStatus(400,"Bad request");
		
	}else{
		emigrants_stats.push(newStat);
		res.sendStatus(201,"Created");
	}

});

///////////////////////////
//////POSTMAN DELETE///////
///////////////////////////

//////////////////////////////////////////////////////// Delete /api/v1/pollution-stats/country/year




///////////////////////
///////PUERTO////////
///////////////////////
app.listen(port,() => {
	
		console.log("Server start");
	
	});
console.log("Starting server...");

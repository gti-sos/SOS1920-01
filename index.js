
const express = require ("express");
const bodyParser = require("body-parser");
const dataStore = require("nedb");
const path = require("path");

const port = process.env.PORT || 80;
const dbFileName = path.join(__dirname, "natality-stats.db");//el método join permite unir un directorio con un archivo.

//app.use("/",express.static("./public")); 

const app = express();
app.use(bodyParser.json());

const db = new dataStore({
				filename: dbFileName,
				autoload: true
			});

const BASE_API_USE = "/api/v1";
const BASE_PATH = "/api";

app.get("/public",(request,response) => {
	response.send("index.html");
});

/////////////////// API JUANFRAN //////////////
var apijuanfran = require("./api-juanfran");
apijuanfran(app, BASE_PATH);
//////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////// Antonio Escobar Núñez /////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


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

//////////////////////////////////////////////////////// POST /api/v1/emigrants-stats
app.post(BASE_API_USE+"/emigrants-stats", (req,res) => {
	
	var newStat = req.body;
	var countryUpd = req.body.country;
	var yearUpd = req.body.year;
		var filtrado = emigrants_stats.filter((c) => {
			return (c.country == countryUpd && c.year == yearUpd);
		});
		if((newStat == "") || (newStat.country == null) || (newStat.year == null) || (newStat.em_man == null) || (newStat.em_woman == null) || 					(newStat.em_totals == null)){
			
			res.sendStatus(400,"Bad request");
			
		} else if(filtrado.length >= 1){
			res.sendStatus(409,"Confict");
		} else {
			emigrants_stats.push(newStat);
			res.sendStatus(201,"Created");
		}
	});

//////////////////////////////////////////////////////// POST /api/v1/emigrants_stats/country
	app.post(BASE_API_USE+"/emigrants-stats/:country",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});
//////////////////////////////////////////////////////// POST /api/v1/emigrants_stats/country/year
	app.post(BASE_API_USE+"/emigrants-stats/:country/:year",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});

///////////////////////////
//////POSTMAN DELETE///////
///////////////////////////

//////////////////////////////////////////////////////// Delete /api/v1/emigrants-stats/country
app.delete(BASE_API_USE+"/emigrants-stats/:country",(req,res) =>{
 	var country = req.params.country;
	
	var emigrants = emigrants_stats.filter((e) => {return (e.country != country);});
	
	
	if(emigrants.length < emigrants_stats.length){
		emigrants_stats = emigrants;
		res.sendStatus(200);
		
	}else{
		res.sendStatus(404,"Not found");
	}	
});

//////////////////////////////////////////////////////// Delete /api/v1/emigrants-stats/country/year

app.delete(BASE_API_USE+"/emigrants-stats/:country/:year",(req,res)=>{
	
	var country = req.params.country;
	var year = req.params.year;
	
	
	var emigrantsC = emigrants_stats.filter((c) => {return (c.country != country || c.year != year);});
	
	
	
	if(emigrantsC.length < emigrants_stats.length){
		emigrants_stats = emigrantsC;
		res.sendStatus(200,"Ok");
	}else{
		res.sendStatus(404,"Not found");
	}
});
//////////////////////////////////////////////////////// Delete /api/v1/emigrants-stats
app.delete(BASE_API_USE+"/emigrants-stats",(req,res)=>{
	
		emigrants_stats=[{}];
		res.sendStatus(200,"Ok");
	
});

////////////////////////
//////POSTMAN PUT///////
////////////////////////

/////////////////////////////////////////////////////// Put Recurso concreto
app.put(BASE_API_USE+"/emigrants-stats/:country/:year", (req, res) =>{
	
	var country=req.params.country;
	var year=req.params.year;
	var upd=req.body;
	var filtrado = emigrants_stats.filter((f) => {
		return (f.country == country && f.year == year);
		});
	
		if(filtrado.length != 1){
			res.sendStatus(404,"Not found");
		}else if(filtrado[0].country != upd.country || filtrado[0].year != upd.year){
			res.sendStatus(409,"Confict, countries and years are diferent");
		}else{
			emigrants_stats.forEach(c => {
				if(c.country == country && c.year == year){
					c.em_man=upd.em_man;
					c.em_woman=upd.em_woman;
					c.em_totals=upd.em_totals;
				}
			});
			res.sendStatus(200,"OK");
		}
	});
///////////////////////////////////////////////////////////////// PUT General "error"
	app.put(BASE_API_USE+"/emigrants-stats",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});

//////////////////////////////////////////////////////////////////PUT General "error"
	app.put(BASE_API_USE+"/emigrants-stats/:country",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});



/////////////////////////////////////// 
///////////////////////////////////////  API ANGELA     
/////////////////////////////////////// 

///////////DATOS////////////


var poverty_stats = [
	{country: "spain",year: 2010,poverty_prp:9551, poverty_pt:8763,poverty_ht:18402},
	{country: "germany",year: 2010,poverty_prp:12648, poverty_pt:11278,poverty_ht:23684},
	{country: "italy",year: 2010,poverty_prp:11124, poverty_pt:9578,poverty_ht:20115},
	{country: "france",year: 2010,poverty_prp:8112, poverty_pt:11976,poverty_ht:25150},
	{country: "united kingdom",year: 2010,poverty_prp:10519, poverty_pt:10263,poverty_ht:21553},

	{country: "spain",year: 2015,poverty_prp:10178, poverty_pt:8011,poverty_ht:16823},
	{country: "germany",year: 2015,poverty_prp:13428, poverty_pt:12401,poverty_ht:26041},
	{country: "italy",year: 2015,poverty_prp:12130, poverty_pt:9508,poverty_ht:19966},
	{country: "france",year: 2015,poverty_prp:8474, poverty_pt:12849,poverty_ht:26983},
	{country: "united kingdom",year: 2015,poverty_prp:10648, poverty_pt:12617,poverty_ht:26495},

	{country: "spain",year: 2017,poverty_prp:9950, poverty_pt:8522,poverty_ht:17896},
	{country: "germany",year: 2017,poverty_prp:13428, poverty_pt:12401,poverty_ht:26041},
	{country: "italy",year: 2017,poverty_prp:12130, poverty_pt:9508,poverty_ht:19966},
	{country: "france",year: 2017,poverty_prp:8474, poverty_pt:12849,poverty_ht:26983},
	{country: "united kingdom",year: 2017,poverty_prp:10648, poverty_pt:12617,poverty_ht:26495}
];

/////////LoadInitialData  

	//- /api/v1/poverty-stats/loadInitialData
    app.get(BASE_API_USE+"/poverty-stats/loadInitialData", (req, res) => {
        var poverty_stats = [
		{country: "spain",year: 2010,poverty_prp:9551, poverty_pt:8763,poverty_ht:18402},
		{country: "germany",year: 2010,poverty_prp:12648, poverty_pt:11278,poverty_ht:23684},
		{country: "italy",year: 2010,poverty_prp:11124, poverty_pt:9578,poverty_ht:20115},
		{country: "france",year: 2010,poverty_prp:8112, poverty_pt:11976,poverty_ht:25150},
		{country: "united kingdom",year: 2010,poverty_prp:10519, poverty_pt:10263,poverty_ht:21553},

		{country: "spain",year: 2015,poverty_prp:10178, poverty_pt:8011,poverty_ht:16823},
		{country: "germany",year: 2015,poverty_prp:13428, poverty_pt:12401,poverty_ht:26041},
		{country: "italy",year: 2015,poverty_prp:12130, poverty_pt:9508,poverty_ht:19966},
		{country: "france",year: 2015,poverty_prp:8474, poverty_pt:12849,poverty_ht:26983},
		{country: "united kingdom",year: 2015,poverty_prp:10648, poverty_pt:12617,poverty_ht:26495},

		{country: "spain",year: 2017,poverty_prp:9950, poverty_pt:8522,poverty_ht:17896},
		{country: "germany",year: 2017,poverty_prp:13428, poverty_pt:12401,poverty_ht:26041},
		{country: "italy",year: 2017,poverty_prp:12130, poverty_pt:9508,poverty_ht:19966},
		{country: "france",year: 2017,poverty_prp:8474, poverty_pt:12849,poverty_ht:26983},
		{country: "united kingdom",year: 2017,poverty_prp:10648, poverty_pt:12617,poverty_ht:26495}
			
		];
		
		res.sendStatus(201,"Created");
    });

////////POSTMAN GET

//-  /api/v1/poverty-stats
app.get(BASE_API_USE+"/poverty-stats",(req,res) =>{

    res.send(JSON.stringify(poverty_stats,null,2));
});

//- /api/v1/poverty-stats/country
app.get(BASE_API_USE+"/poverty-stats/:country", (req,res) => {
    var country = req.params.country;
	
	var poverty = poverty_stats.filter((e) => {return (e.country == country);});
	
	
	if(poverty.length >= 1){
		res.send(poverty);
	}else{
		res.sendStatus(404,"Not found");
	}
});

//- /api/v1/poverty-stats/country/year
app.get(BASE_API_USE+"/poverty-stats/:country/:year", (req,res) => {
    var country = req.params.country;
	var year = req.params.year;
	
	var povertyC = poverty_stats.filter((c) => {return (c.country == country);});
	
	var povertyY = poverty_stats.filter((y) => {return(y.year == year);});
	
	
	if(povertyC.length >= 1 && povertyY.length >=1){
		var sol = povertyC.filter((s) => {return(s.year == year);});
		res.send(sol);
	}else{
		res.sendStatus(404,"Not found");
	}
});

////////POSTMAN POST

//- /api/v1/poverty-stats
app.post(BASE_API_USE+"/poverty-stats", (req,res) => {
    var newStat = req.body;
	
	if ((newStat== "") || (newStat.country==null) || (newStat.year==null) || 
        (newStat.poverty_prp==null) || (newStat.poverty_pt==null) || (newStat.poverty_ht==null)){
	  
		res.sendStatus(400,"Bad request");
		
	}else{
		poverty_stats.push(newStat);
		res.sendStatus(201,"Created");
	}

});

//-  /api/v1/poverty_stats/country
	app.post(BASE_API_USE+"/poverty-stats/:country",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});
//- /api/v1/poverty_stats/country/year
	app.post(BASE_API_USE+"/poverty-stats/:country/:year",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});

//////POSTMAN DELETE
//- /api/v1/poverty-stats/country/year

app.delete(BASE_API_USE+"/poverty-stats/:country/:year",(req,res)=>{

    var country = req.params.country;
    var year = req.params.year;


    var povertyC = poverty_stats.filter((c) => {return (c.country != country || c.year != year);});



    if(povertyC.length < poverty_stats.length){
        poverty_stats = povertyC;
        res.sendStatus(200,"Ok");
    }else{
        res.sendStatus(404,"Not found");
    }
	});

//- /api/v1/poverty-stats/country
app.delete(BASE_API_USE+"/poverty-stats/:country",(req,res) =>{
 	var country = req.params.country;
	
	var poverty = poverty_stats.filter((e) => {return (e.country != country);});
	
	
	if(poverty.length < poverty_stats.length){
		poverty_stats = poverty;
		res.sendStatus(200);
		
	}else{
		res.sendStatus(404,"Not found");
	}	
});

///- /api/v1/poverty-stats
app.delete(BASE_API_USE+"/poverty-stats",(req,res)=>{
	
		poverty_stats=[];
		res.sendStatus(200,"Ok");
	
});


////////PUT
app.put(BASE_API_USE+"/poverty-stats/:country/:year", (req, res) =>{
	
	var country=req.params.country;
	var year=req.params.year;
	var upd=req.body;

	var filtrado = poverty_stats.filter((f) => {
		return (f.country == country && f.year == year);
		});
	
		if(filtrado.length != 1){
			res.sendStatus(404,"Not found");
		}else if(filtrado[0].country != upd.country || filtrado[0].year != upd.year){
			res.sendStatus(409,"Confict, countries and years are diferent");
		}else{
			poverty_stats.forEach(c => {
				if(c.country == country && c.year == year){
					c.poverty_prp=upd.poverty_prp;
					c.poverty_pt=upd.poverty_pt;
					c.poverty_ht=upd.poverty_ht;

				}
			});
			res.sendStatus(200,"OK");
		}
	});

//- General "error"
	app.put(BASE_API_USE+"/poverty-stats",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});

//- General "error"
	app.put(BASE_API_USE+"/poverty-stats/:country",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});


 // ---------------- SERVIDOR ----------------
console.log("Server already");
app.listen(port,() => {
		console.log("Server start");
});


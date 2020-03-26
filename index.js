const express = require ("express");

const bodyParser = require("body-parser");

var app = express();

app.use("/",express.static("./public")); 
app.use(bodyParser.json());

var port = process.env.PORT || 80;
const BASE_API_USE = "/api/v1";


app.get("/public",(request,response) => {
	response.send("index.html");
});

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
	
		emigrants_stats=[];
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

//-------------- API Juanfran -----------
var natality_stats = [
	{
		country : "spain",
		year: 2017,
		natality_totals : 393181,
		natality_men : 202478,
		natality_women : 190703
	},
	{
		country : "germany",
		year: 2017,
		natality_totals : 784901,
		natality_men : 402517,
		natality_women : 382384
	},
	{
		country : "italy",
		year: 2017,
		natality_totals : 458151,
		natality_men : 235733,
		natality_women : 222418
	},
	{
		country : "france",
		year: 2017,
		natality_totals : 770045,
		natality_men : 394058,
		natality_women : 375987
	},
	{
		country : "united kingdom",
		year: 2017,
		natality_totals : 754754,
		natality_men : 387030,
		natality_women : 367754
	},
	{
		country : "spain",
		year: 2015,
		natality_totals : 420290,
		natality_men : 216496,
		natality_women : 203794
	},
	{
		country : "germany",
		year: 2015,
		natality_totals : 737575,
		natality_men : 378478,
		natality_women : 359097
	},
	{
		country : "italy",
		year: 2015,
		natality_totals : 485780,
		natality_men : 249950,
		natality_women : 235830
	},
	{
		country : "france",
		year: 2015,
		natality_totals : 799671,
		natality_men : 409145,
		natality_women : 390526
	},
	{
		country : "united kingdom",
		year: 2015,
		natality_totals : 776746,
		natality_men : 398760,
		natality_women : 377986
	},
	{
		country : "spain",
		year: 2010,
		natality_totals : 486575,
		natality_men : 250727,
		natality_women : 235848
	},
	{
		country : "germany",
		year: 2010,
		natality_totals : 677947,
		natality_men : 347237,
		natality_women : 330710
	},
	{
		country : "italy",
		year: 2010,
		natality_totals : 561944,
		natality_men : 289185,
		natality_women : 272759
	},
	{
		country : "france",
		year: 2010,
		natality_totals : 833654,
		natality_men : 426270,
		natality_women : 407384
	},
	{
		country : "united kingdom",
		year: 2010,
		natality_totals : 807271,
		natality_men : 413755,
		natality_women : 393516
	}
];

// ------------- GET natality_stats -------------------------
app.get(BASE_API_USE+"/natality-stats",(req,res) =>{
    res.send(JSON.stringify(natality_stats,null,2));
});

// -------------- GET natality_stats country para un elemento concreto -------
///api/v1/natality_stats/country
app.get(BASE_API_USE+"/natality-stats/:country", (req,res) => {
    var country = req.params.country;

    var natality = natality_stats.filter((c) => {return (c.country == country);});


    if(natality.length >= 1){
        res.send(natality);
    }else{
        res.sendStatus(404,"NOT FOUND");
    }
});

//----------  GET /api/v1/emigrants-stats/country/year en este caso también filtramos por año
app.get(BASE_API_USE+"/natality-stats/:country/:year", (req,res) => {
    var country = req.params.country;
    var year = req.params.year;

    var natalityC = natality_stats.filter((c) => {
		return (c.country == country);
	});

    var natalityY = natality_stats.filter((y) => {
		return(y.year == year);
	});


    if(natalityC.length >= 1 && natalityY.length >=1){
        var solucion = natalityC.filter((s) => {
			return(s.year == year);
		});
        res.send(solucion);
    }else{
        res.sendStatus(404,"NOT FOUND");
    }
});

// --------------- loadInitialDataInitialData ----------------------
 app.get(BASE_API_USE + "/natality-stats/loadInitialData", (req, res) => {
	 var natality_stats = [
	{
		country : "spain",
		year: 2017,
		natality_totals : 393181,
		natality_men : 202478,
		natality_women : 190703
	},
	{
		country : "germany",
		year: 2017,
		natality_totals : 784901,
		natality_men : 402517,
		natality_women : 382384
	},
	{
		country : "italy",
		year: 2017,
		natality_totals : 458151,
		natality_men : 235733,
		natality_women : 222418
	},
	{
		country : "france",
		year: 2017,
		natality_totals : 770045,
		natality_men : 394058,
		natality_women : 375987
	},
	{
		country : "united kingdom",
		year: 2017,
		natality_totals : 754754,
		natality_men : 387030,
		natality_women : 367754
	},
	{
		country : "spain",
		year: 2015,
		natality_totals : 420290,
		natality_men : 216496,
		natality_women : 203794
	},
	{
		country : "germany",
		year: 2015,
		natality_totals : 737575,
		natality_men : 378478,
		natality_women : 359097
	},
	{
		country : "italy",
		year: 2015,
		natality_totals : 485780,
		natality_men : 249950,
		natality_women : 235830
	},
	{
		country : "france",
		year: 2015,
		natality_totals : 799671,
		natality_men : 409145,
		natality_women : 390526
	},
	{
		country : "united kingdom",
		year: 2015,
		natality_totals : 776746,
		natality_men : 398760,
		natality_women : 377986
	},
	{
		country : "spain",
		year: 2010,
		natality_totals : 486575,
		natality_men : 250727,
		natality_women : 235848
	},
	{
		country : "germany",
		year: 2010,
		natality_totals : 677947,
		natality_men : 347237,
		natality_women : 330710
	},
	{
		country : "italy",
		year: 2010,
		natality_totals : 561944,
		natality_men : 289185,
		natality_women : 272759
	},
	{
		country : "france",
		year: 2010,
		natality_totals : 833654,
		natality_men : 426270,
		natality_women : 407384
	},
	{
		country : "united kingdom",
		year: 2010,
		natality_totals : 807271,
		natality_men : 413755,
		natality_women : 393516
	}
];
	 res.sendStatus(201,"CREATE");
 });

// ---------------- POST natality_stats crea un nuevo recurso-----------------------
	app.post(BASE_API_USE + "/natality-stats", (req, res) => {
		var newNat = req.body;
		var countryNewNat = req.body.country;
		var yearNewNat = req.body.year;
		
		var filteredStats = natality_stats.filter((c) => {
            return (c.country == countryNewNat && c.year == yearNewNat);
        });
        if((newNat == "") || (newNat.country == null) || (newNat.year == null) || (newNat.natality_totals == null) || (newNat.natality_men == null) || newNat.natality_women == null){
            res.sendStatus(400,"BAD REQUEST");
        } else if(filteredStats.length >= 1){
            res.sendStatus(409,"CONFLICT");
        } else {
            natality_stats.push(newNat);
            res.sendStatus(201,"CREATED");
        }
	});

// ------------- POST devuelve error de metodo no permitido -------------
// POST recursos country
    app.post(BASE_API_USE+"/natality-stats/:country",(req,res) =>{
        res.sendStatus(405,"METHOD NOT ALLOWED");
    });
// ------------ POST recueros country/year ------------
    app.post(BASE_API_USE+"/natality-stats/:country/:year",(req,res) =>{
        res.sendStatus(405,"METHOD NOT ALLOWED");
    });

// ------- DALETE natality_stats/country borramos un recurso concreto.
app.delete(BASE_API_USE + "/natality-stats/:country", (req, res) =>{
	
	var country = req.params.country;
	
	var filteredNatality = natality_stats.filter((c) => {
		return (c.country != country);
		
	});

	if(filteredNatality.length < natality_stats.length){
		natality_stats = filteredNatality;
		res.sendStatus(200);
	}else{
		res.sendStatus(404,"NATALITY NOT FOUND")
	}
});
// ------- DALETE natality_stats/country/year borramos a un pais de un determinado año
app.delete(BASE_API_USE + "/natality-stats/:country/:year", (req,res) =>{
	
	var country = req.params.country;
	var year = req.params.year;
	
	var natalityC = natality_stats.filter((c) => {
		return (c.country != country || c.year != year)
	});
	
	if(natalityC.length < natality_stats.length) {
		
	   natality_stats = natalityC;
	   res.sendStatus(200, "OK");
	   }else{
		   res.endStatus(404,"NOT FOUND");
		}
});

//  -------------DELETE borra too los recursos -----
app.delete(BASE_API_USE+"/natality_stats",(req,res)=>{
	
		natality_stats=[];
		res.sendStatus(200,"Ok");
	
});


 // ------------- PUT /natality_stats ---------
app.put(BASE_API_USE+"/natality_stats/:country/:year", (req, res) =>{
	
	var country=req.params.country;
	var year=req.params.year;
	var upd=req.body;
	var filter = natality_stats.filter((f) => {
		return (f.country == country && f.year == year);
		});
	
		if(filter.length != 1){
			res.sendStatus(404,"NOT FOUND");
		}else if(filter[0].country != upd.country || filter[0].year != upd.year){
			res.sendStatus(409,"CONFLICT, countries and years are diferent");
		}else{
			natality_stats.forEach(c => {
				if(c.country == country && c.year == year){
					c.nat_totals=upd.nat_totals;
					c.nat_mem=upd.nat_mem;
					c.nat_women=upd.nat_women;
				}
			});
			res.sendStatus(200,"OK");
		}
	});
// PUT ERROR General /natality_stats
	app.put(BASE_API_USE+"/emigrants-stats",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});

///PUT ERROR General /natality_stats/country para un país determinado
	app.put(BASE_API_USE+"/emigrants-stats/:country",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});

 // ---------------- SERVIDOR ----------------
console.log("Server already");
app.listen(port,() => {
		console.log("Server start");
});

module.exports = function(app,BASE_PATH){

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
app.get(BASE_PATH+"/emigrants-stats/loadInitialData", (req, res) => {		
		db.insert(emigrants_stats);
		res.sendStatus(200,"ok");
		console.log("Initial emigrants_stats loaded:" +JSON.stringify(emigrants_stats,null,2));
});
///////////////////////////
////////POSTMAN GET////////
///////////////////////////

//////////////////////////////////////////////////////////////// GET /api/v1/emigrants-stats
app.get(BASE_PATH+"/emigrants-stats",(req,res) =>{
	
	res.send(JSON.stringify(emigrants_stats,null,2));
});
	
app.get(BASE_PATH+"/emigrants-stats",(req,res) =>{
    console.log("New GET .../emigrants-stats");
    db.find({}, (error, emigrants_stats) => { //dejamos la QUERY vacía para que devuelva todos los objetos.

        emigrants_stats.forEach( (c) => {
             res.send(JSON.stringify(emigrants_stats,null,2));
        });
    });
});
	
//////////////////////////////////////////////////////////////// GET /api/v1/emigrants-stats/country
app.get(BASE_PATH+"/emigrants-stats/:country", (req,res) => {
    var country = req.params.country;
	
	var emigrants = emigrants_stats.filter((e) => {return (e.country == country);});
	
	
	if(emigrants.length >= 1){
		res.send(emigrants);
	}else{
		res.sendStatus(404,"Not found");
	}
});
//////////////////////////////////////////////////////////////// GET /api/v1/emigrants-stats/country/year
app.get(BASE_PATH+"/emigrants-stats/:country/:year", (req,res) => {
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
app.post(BASE_PATH+"/emigrants-stats", (req,res) => {
	
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
	app.post(BASE_PATH+"/emigrants-stats/:country",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});
//////////////////////////////////////////////////////// POST /api/v1/emigrants_stats/country/year
	app.post(BASE_PATH+"/emigrants-stats/:country/:year",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});

///////////////////////////
//////POSTMAN DELETE///////
///////////////////////////

//////////////////////////////////////////////////////// Delete /api/v1/emigrants-stats/country
app.delete(BASE_PATH+"/emigrants-stats/:country",(req,res) =>{
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

app.delete(BASE_PATH+"/emigrants-stats/:country/:year",(req,res)=>{
	
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
app.delete(BASE_PATH+"/emigrants-stats",(req,res)=>{
	
		emigrants_stats=[{}];
		res.sendStatus(200,"Ok");
	
});

////////////////////////
//////POSTMAN PUT///////
////////////////////////

/////////////////////////////////////////////////////// Put Recurso concreto
app.put(BASE_PATH+"/emigrants-stats/:country/:year", (req, res) =>{
	
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
	app.put(BASE_PATH+"/emigrants-stats",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});

//////////////////////////////////////////////////////////////////PUT General "error"
	app.put(BASE_PATH+"/emigrants-stats/:country",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});
}
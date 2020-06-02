module.exports = function(app,BASE_PATH){
	
	const dataStore = require("nedb");
	const path = require("path");
	
	const dbnatality = path.join(__dirname, "natality-stats.db");
	const dbn = new dataStore({
		filename: dbnatality,
		autoload: true
	});
//-------------- API Juanfran -----------
var initialNatality_stats = [
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
		country : "unitedKingdom",
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
		country : "unitedKingdom",
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
		country : "unitedKingdom",
		year: 2010,
		natality_totals : 807271,
		natality_men : 413755,
		natality_women : 393516
	}
];

// --------------- Proxy -------------------
const request = require('request'); 
const express = require ("express"); 

var api28 = 'https://sos1920-28.herokuapp.com'; 
var path28 = '/api/v1/gce'; 

app.use(path28, function(req, res) { 
	var url = api28 + req.baseUrl + req.url; 
	console.log('piped: ' + req.baseUrl + req.url); 
	req.pipe(request(url)).pipe(res); 
}); 
	app.use(express.static('.'));

// --------------- loadInitialData ----------------------
 app.get(BASE_PATH + "/natality-stats/loadInitialData", (req, res) => {
	 dbn.remove({}, {multi:true});
	 dbn.insert(initialNatality_stats);
	 res.sendStatus(200);
	 console.log("Initial natality_stats loaded:" +JSON.stringify(initialNatality_stats,null,2));
 });

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ------------- GET natality_stats -------------------------
	
/* app.get(BASE_PATH+"/natality-stats",(req,res) => { //req vienen los datos de la petición realizada.
	
	console.log("New GET .../natality_stats");
	dbn.find({}, (error, initialNatality_stats) => { //dejamos la QUERY vacía para que devuelva todos los objetos.
			initialNatality_stats.forEach((n) =>{
				delete n._id
			});

		res.send(JSON.stringify(initialNatality_stats,null,2));
	});  
}); */
app.get(BASE_PATH +"/natality-stats",(req,res) =>{
	
	var limit = parseInt(req.query.limit);
	var offset = parseInt(req.query.offset);
	var search = {};
	
	if(req.query.country) search['country'] = req.query.country;
	if(req.query.year) search['year'] = parseInt(req.query.year);

	///////natality_totals///////////////////////////////////////////////////////
	if(req.query.natality_totalsMin && req.query.natality_totalsMax)
		search['natality_totals'] = {
			$gte: parseInt(req.query.natality_totalsMin),
			$lte: parseInt(req.query.natality_totalsMax)
		}
	if(req.query.natality_totalsMin && !req.query.natality_totalsMax)
		search['natality_totals'] = {
			$gte: parseInt(req.query.natality_totalsMin)
		};
	if(!req.query.natality_totalsMin && req.query.natality_totalsMax)
		search['natality_totals'] = {
			$lte: parseInt(req.query.natality_totalsMax)
		};
	
	/////////////natality_men///////////////////////////////////////
	if(req.query.natality_menMin && req.query.natality_menMax)
		search['natality_men'] = {
			$gte: parseInt(req.query.natality_menMin),
			$lte: parseInt(req.query.natality_menMax)
		}
	if(req.query.natality_menMin && !req.query.natality_menMax)
		search['natality_men'] = {
			$gte: parseInt(req.query.natality_menMin)
		};

	////////////////////natality_women///////////////////////////////////////////77
	if(req.query.natality_womenMin && req.query.natality_womenMax)
		search['natality_women'] = {
			$gte: parseInt(req.query.natality_womenMin),
			$lte: parseInt(req.query.natality_womenMax)
		}
	if(req.query.natality_womenMin && !req.query.natality_womenMax)
		search['natality_women'] = {
			$gte: parseInt(req.query.natality_womenMin)
		};
	if(!req.query.natality_womenMin && req.query.natality_womenMax)
		search['natality_women'] = {
			$lte: parseInt(req.query.natality_womenMax)
		};
	
	dbn.find(search).skip(offset).limit(limit).exec(function(error, natality){
			natality.forEach(n => {
				delete n._id;
			});
		if(natality == 0){
			res.sendStatus(404, "NOT FOUND");
		}else{
			res.send(JSON.stringify(natality,null,2));
			console.log("Datos enviados: " + JSON.stringify(natality,null,2));
		}
	});
});

// -------------- GET natality_stats country -------
///api/v1/natality_stats/country
app.get(BASE_PATH+"/natality-stats/:country", (req,res) => {
    var country = req.params.country;
	
	dbn.find({country: country}, (err, nataly) => {
		
		if(nataly.length==0){
		   	console.log("ERROR 404. NOT FOUND");
			res.sendStatus(404);
		 }
		
		else{		
		
			nataly.forEach(e => {
			delete e._id;	
			});
			res.send(JSON.stringify(nataly, null, 2)); //En este get me saca un objeto no el array de los objetos
		}
	});	
});
//----------  GET /api/v1/emigrants-stats/country/year en este caso también filtramos por año
app.get(BASE_PATH+"/natality-stats/:country/:year", (req,res) => {
    var country = req.params.country;
    var year = parseInt(req.params.year);

		dbn.find({country: country, year: year}, (err, natality) => {
		
		if(natality.length==0){
		   	console.log("ERROR 404. NOT FOUND");
			res.sendStatus(404);
		 }
		
		else{		
		
			natality.forEach(e => {
			delete e._id;	
			});
			res.send(JSON.stringify(natality[0], null, 2)); //En este get me saca un objeto no el array de los objetos
		}
	});		
});
////////////////////////////////////////////////////////////////////////////////////////////////////7
// ---------------- POST /natality_stats (crear un nuevo recurso) -----------------------
	app.post(BASE_PATH + "/natality-stats", (req, res) => {
		var newNat = req.body;
		
		dbn.find({country: newNat.country, year: newNat.year},(error, natality)=>{
			if(natality.length != 0){	
				console.log("409,conflict");
				res.sendStatus(409);
			}
		
        	else if((newNat == "") || 
		   		(newNat.country == null) || (newNat.country == "") ||
		   		(newNat.year == null) || (newNat.year == "") || 
		   		(newNat.natality_totals == null) || (newNat.natality_totals == "") || 
		   		(newNat.natality_men == null) || (newNat.natality_men == "") || 
		   		(newNat.natality_women == null) || (newNat.natality_women == "")){
			
            	res.sendStatus(400,"BAD REQUEST");
			}else{
				dbn.insert(newNat);
            	res.sendStatus(201,"CREATED");
        	}
		});
	});

// ------------- POST devuelve error de metodo no permitido -------------
// POST recursos country
    app.post(BASE_PATH+"/natality-stats/:country",(req,res) =>{
        res.sendStatus(405,"METHOD NOT ALLOWED");
    });
// ------------ POST recueros country/year ------------
    app.post(BASE_PATH+"/natality-stats/:country/:year",(req,res) =>{
        res.sendStatus(405,"METHOD NOT ALLOWED");
    });
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ------- DALETE natality_stats/country borramos un recurso concreto.
app.delete(BASE_PATH + "/natality-stats/:country", (req, res) =>{
	
	var country = req.params.country;
	
	dbn.find({country: country}, (err, nat) => {
		nat.forEach(e => {
			dbn.remove({country : e.country},{});
		});
		});
	
	res.sendStatus(200, "REMOVED");
});
// ------- DALETE natality_stats/country/year borramos a un pais de un determinado año
app.delete(BASE_PATH + "/natality-stats/:country/:year", (req,res) =>{
	
	var country = req.params.country;
	var year = parseInt(req.params.year);
	
	dbn.remove({country: country, year: year},{});
	res.sendStatus(200, "REMOVED");
});

//  -------------DELETE /natality-stats -----
app.delete(BASE_PATH + "/natality-stats", (req,res) => {
		
		dbn.remove({}, {multi:true});
		res.sendStatus(200,"Ok");
		console.log("Todo los datos están borrados");
	
});

/////////////////////////////////////////////////////////////////////////////////////////////////////
 // ------------- PUT /natality_stats ---------
app.put(BASE_PATH+"/natality-stats/:country/:year", (req, res) =>{

		var country=req.params.country;
		var year=parseInt(req.params.year);
		var upd=req.body;
		var nCont = upd.country;
		var nYear = parseInt(upd.year);
		
		dbn.find({"country":country, "year": year},(error,nat)=>{
			console.log(nat);
			if(nat.length == 0){
				console.log("Error 404, recurso no encontrado.");
				res.sendStatus(404);
			}else if(!nCont || !nYear || !upd.natality_totals||!upd.natality_men||!upd.natality_women ||country != nCont || year != nYear){
				res.sendStatus(409, "NATALITY CONFLICT");
			}else{
				dbn.update({country: country, year: year}, 
							  {$set: upd});
				res.sendStatus(200, "NATALITY MODIFIED");
			}
		
		});
	});

// PUT ERROR General /natality_stats
	app.put(BASE_PATH+"/natality-stats",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});

///PUT ERROR General /natality_stats/country para un país determinado
	app.put(BASE_PATH+"/natality-stats/:country",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});

}
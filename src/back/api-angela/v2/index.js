///////////  API ANGELA  ////////////// 


///////////DATOS////////////

module.exports = function(app,BASE_PATH){
	
const path = require("path");
const dataStore = require("nedb");

////////////// BASE DE DATOS //////////////

	const povertydb = path.join(__dirname, "poverty-stats.db");
    const pdb = new dataStore({
        filename: povertydb,
        autoload: true
    });
	
var poverty_stats = [
	{country: "spain",year: 2010,poverty_prp:9551, poverty_pt:8763,poverty_ht:18402},
	{country: "germany",year: 2010,poverty_prp:12648, poverty_pt:11278,poverty_ht:23684},
	{country: "italy",year: 2010,poverty_prp:11124, poverty_pt:9578,poverty_ht:20115},
	{country: "france",year: 2010,poverty_prp:8112, poverty_pt:11976,poverty_ht:25150},
	{country: "unitedKingdom",year: 2010,poverty_prp:10519, poverty_pt:10263,poverty_ht:21553},

	{country: "spain",year: 2015,poverty_prp:10178, poverty_pt:8011,poverty_ht:16823},
	{country: "germany",year: 2015,poverty_prp:13428, poverty_pt:12401,poverty_ht:26041},
	{country: "italy",year: 2015,poverty_prp:12130, poverty_pt:9508,poverty_ht:19966},
	{country: "france",year: 2015,poverty_prp:8474, poverty_pt:12849,poverty_ht:26983},
	{country: "unitedKingdom",year: 2015,poverty_prp:10648, poverty_pt:12617,poverty_ht:26495},

	{country: "spain",year: 2017,poverty_prp:9950, poverty_pt:8522,poverty_ht:17896},
	{country: "germany",year: 2017,poverty_prp:13428, poverty_pt:12401,poverty_ht:26041},
	{country: "italy",year: 2017,poverty_prp:12130, poverty_pt:9508,poverty_ht:19966},
	{country: "france",year: 2017,poverty_prp:8474, poverty_pt:12849,poverty_ht:26983},
	{country: "unitedKingdom",year: 2017,poverty_prp:10648, poverty_pt:12617,poverty_ht:26495}
];
/////////////////////////PROXY
const request = require('request');
const express = require ("express");


/////API28
var api28 = 'https://sos1920-28.herokuapp.com';
var path28 = '/api/v1/ppas';

app.use(path28, function(req, res) {
	var url = api28 + req.baseUrl + req.url;
	console.log('piped: ' + req.baseUrl + req.url);
	req.pipe(request(url)).pipe(res);
});
app.use(express.static('.'));
/////API22
var api22 = 'https://sos1920-22.herokuapp.com';
var path22 = '/api/v1/swim-stats';

app.use(path22, function(req, res) {
	var url = api22 + req.baseUrl + req.url;
	console.log('piped: ' + req.baseUrl + req.url);
	req.pipe(request(url)).pipe(res);
});
app.use(express.static('.'));


	//- /api/v1/poverty-stats/loadInitialData
app.get(BASE_PATH+"/poverty-stats/loadInitialData", (req, res) => {
	pdb.remove({}, { multi: true });
	pdb.insert(poverty_stats);
	
	
	res.sendStatus(200);//
	console.log("Initial poverty_stats loaded:" +JSON.stringify(poverty_stats,null,2));
});

////////POSTMAN GET

//-  /api/v1/poverty-stats

app.get(BASE_API_URL + "/poverty-stats", (req,res)=>{
	var dbquery = {};
	let offset = 0;
	let limit = Number.MAX_SAFE_INTEGER;
	
	//PAGINACIÓN
	if (req.query.offset) {
		offset = parseInt(req.query.offset);
		delete req.query.offset;
	}
	if (req.query.limit) {
		limit = parseInt(req.query.limit);
		delete req.query.limit;
	}
	
	//BUSQUEDA
	if(req.query.country) dbquery["country"]= req.query.country;
	if(req.query.year) dbquery["year"] = parseInt(req.query.year);
	if(req.query.traveller) dbquery["poverty_prp"] = parseFloat(req.query.poverty_prp);
	if(req.query.overnightstay) dbquery["poverty_pt"] = parseFloat(req.query.poverty_pt);
	if(req.query.averagestay) dbquery["poverty_ht"] = parseFloat(req.query.poverty_ht);	
	
	db.find(dbquery).sort({country:1,year:-1}).skip(offset).limit(limit).exec((error, poverty) =>{

		poverty.forEach((t)=>{
			delete t._id
		});

		res.send(JSON.stringify(poverty,null,2));
		console.log("Recursos");
	});
});

//- /api/v1/poverty-stats/country
app.get(BASE_PATH+"/poverty-stats/:country", (req,res) => {
    var country = req.params.country;
	
	pdb.find({country: country}, (err, pov) => {

		
		if(pov.length==0){
		   	console.log("ERROR 404. NOT FOUND");
			res.sendStatus(404);
		 }
		
		else{		
		
			pov.forEach(e => {
			delete e._id;	
			});
			res.send(JSON.stringify(pov, null, 2)); //En este get me saca un objeto no el array de los objetos
		}
	});		

/*	var poverty = poverty_stats.filter((e) => {return (e.country == country);});
	
	
	if(poverty.length >= 1){
		res.send(poverty);
	}else{
		res.sendStatus(404,"Not found");
	}*/
});

//- /api/v1/poverty-stats/country/year
app.get(BASE_PATH+"/poverty-stats/:country/:year", (req,res) => {
    var country = req.params.country;
	var year = parseInt(req.params.year);  
	
	pdb.find({country: country, year: year}, (err, pov) => {
		
		if(pov.length==0){
		   	console.log("ERROR 404. NOT FOUND");
			res.sendStatus(404);
		 }
		
		else{		
		
			pov.forEach(e => {
			delete e._id;	
			});
			res.send(JSON.stringify(pov[0], null, 2)); //En este get me saca un objeto no el array de los objetos
		}
	});		
	/*
	var povertyC = poverty_stats.filter((c) => {return (c.country == country);});
	
	var povertyY = poverty_stats.filter((y) => {return(y.year == year);});
	
	
	if(povertyC.length >= 1 && povertyY.length >=1){
		var sol = povertyC.filter((s) => {return(s.year == year);});
		res.send(sol);
	}else{
		res.sendStatus(404,"Not found");
	}*/
});

////////POSTMAN POST

//- /api/v1/poverty-stats
app.post(BASE_PATH+"/poverty-stats", (req,res) => {
    var newStat = req.body;
	
	pdb.find({country: newStat.country, year: newStat.year},(error, pov)=>{
	if(pov.length != 0){	
			console.log("409. conflict, el objeto ya existe");
			res.sendStatus(409);
	}

	else if ((newStat== "") || 
		(newStat.country==null) || (newStat.country=="") ||
		(newStat.year==null) || (newStat.year=="") || 
        (newStat.poverty_prp==null) || (newStat.poverty_prp=="") || 
		(newStat.poverty_pt==null) || (newStat.poverty_pt=="") || 
		(newStat.poverty_ht==null) || (newStat.poverty_ht=="")){
	  
		res.sendStatus(400,"Bad request");
		
	}else{
		pdb.insert(newStat);
	//	poverty_stats.push(newStat);
		res.sendStatus(201,"Created");
	}
	});
});

//-  /api/v1/poverty_stats/country
	app.post(BASE_PATH+"/poverty-stats/:country",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});
//- /api/v1/poverty_stats/country/year
	app.post(BASE_PATH+"/poverty-stats/:country/:year",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});

//////POSTMAN DELETE
//- /api/v1/poverty-stats/country/year

app.delete(BASE_PATH+"/poverty-stats/:country/:year",(req,res)=>{
	
    var country = req.params.country;
    var year = parseInt(req.params.year);
	
	pdb.remove({country: country, year: year}, {});
	res.sendStatus(200, "POVERTY REMOVED");
   /* var povertyC = poverty_stats.filter((c) => {return (c.country != country || c.year != year);});



    if(povertyC.length < poverty_stats.length){
        poverty_stats = povertyC;
        res.sendStatus(200,"Ok");
    }else{
        res.sendStatus(404,"Not found");
    }*/
	});

//- /api/v1/poverty-stats/country
app.delete(BASE_PATH+"/poverty-stats/:country",(req,res) =>{
	
 	var country = req.params.country;
	pdb.find({country: country}, (err, pov) => {
		pov.forEach(e => {
			pdb.remove({country : e.country},{});
		});
	});
	res.sendStatus(200, "POVERTY REMOVED");
	
	/*var poverty = poverty_stats.filter((e) => {return (e.country != country);});
	
	
	if(poverty.length < poverty_stats.length){
		poverty_stats = poverty;
		res.sendStatus(200);
		
	}else{
		res.sendStatus(404,"Not found");
	}	*/
});

///- /api/v1/poverty-stats
app.delete(BASE_PATH+"/poverty-stats",(req,res)=>{
		
		pdb.remove({}, { multi: true });
		//poverty_stats=[];
		res.sendStatus(200,"Ok");
		console.log("Todo borrado");
	
});


////////PUT
app.put(BASE_PATH+"/poverty-stats/:country/:year", (req, res) =>{
	var country=req.params.country;
	var year=parseInt(req.params.year);
	var upd=req.body;
	var nCont = upd.country;
	var nYear = parseInt(upd.year);
	
	pdb.find({"country":country, "year": year},(error,pov)=>{
		console.log(pov);
		if(pov.length == 0){
			console.log("Error 404, recurso no encontrado.");
			res.sendStatus(404);
		}else if(!nCont || !nYear || !upd.poverty_prp||!upd.poverty_pt||!upd.poverty_ht ||country != nCont || year != nYear){
			res.sendStatus(409, "POVERTY CONFLICT");
		}else{
			pdb.update({country: country, year: year}, 
						  {$set: upd});
			res.sendStatus(200, "POVERTY MODIFIED");
		}
	
	});
});

//- General "error"
	app.put(BASE_PATH+"/poverty-stats",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});

//- General "error"
	app.put(BASE_PATH+"/poverty-stats/:country",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});
}
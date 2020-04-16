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
app.get(BASE_PATH+"/poverty-stats/loadInitialData", (req, res) => {
	pdb.remove({}, { multi: true });
	pdb.insert(poverty_stats);
	
	
	res.sendStatus(200);
	console.log("Initial poverty_stats loaded:" +JSON.stringify(poverty_stats,null,2));
});

////////POSTMAN GET

//-  /api/v1/poverty-stats
app.get(BASE_PATH+"/poverty-stats",(req,res) =>{
	var limit = parseInt(req.query.limit);
	var offset = parseInt(req.query.offset);
	var search = {};
	
	if(req.query.country) search['country'] = req.query.country;
	if(req.query.year) search['year'] = parseInt(req.query.year);
	
	/////primer atributo --- poverty_prp
	
	if(req.query.poverty_prpMin && req.query.poverty_prpMax)
		search['poverty_prp'] = {
			$gte: parseInt(req.query.poverty_prpMin),
			$lte: parseInt(req.query.poverty_prpMax)
		}
	if(req.query.poverty_prpMin && !req.query.poverty_prpMax)
		search['poverty_prp'] = {$gte: parseInt(req.query.poverty_prpMin)};
	if(!req.query.poverty_prpMin && req.query.poverty_prpMax)
		search['poverty_prp'] = {$lte: parseInt(req.query.poverty_prpMax)}
	
	/////segundo atributo --- poverty_pt
	
	if(req.query.poverty_ptMin && req.query.poverty_ptMax)
		search['poverty_pt'] = {
			$gte: parseInt(req.query.poverty_ptMin),
			$lte: parseInt(req.query.poverty_ptMax)
		}
	if(req.query.poverty_ptMin && !req.query.poverty_ptMax)
		search['poverty_prp'] = {$gte: parseInt(req.query.poverty_ptMin)};
	if(!req.query.poverty_ptMin && req.query.poverty_ptMax)
		search['poverty_prp'] = {$lte: parseInt(req.query.poverty_ptMax)}
	
	/////tercer atrbuto --- poverty_ht
	
	if(req.query.poverty_htMin && req.query.poverty_htMax)
		search['poverty_ht'] = {
			$gte: parseInt(req.query.poverty_htMin),
			$lte: parseInt(req.query.poverty_htMax)
		}
	if(req.query.poverty_htMin && !req.query.poverty_htMax)
		search['poverty_ht'] = {$gte: parseInt(req.query.poverty_htMin)};
	if(!req.query.poverty_htMin && req.query.poverty_htMax)
		search['poverty_ht'] = {$lte: parseInt(req.query.poverty_htMax)}
	
	pdb.find(search).skip(offset).limit(limit).exec(function(err, pov){
			pov.forEach((i)=>{
				delete i._id
			});
		
		if(pov == 0){
			res.sendStatus(404, "Poverty Not Found");
		}else{
			console.log("Data sent: "+JSON.stringify(pov, null,2));
			res.send(JSON.stringify(pov, null, 2));
			
		}	
	});
	/*	console.log("New GET .../poverty_stats");
    pdb.find({}, (error, pov) => { 
		pov.forEach((i)=>{
				delete i._id
			});
		res.send(JSON.stringify(pov,null,2));
		
	});*/
});

//- /api/v1/poverty-stats/country
app.get(BASE_PATH+"/poverty-stats/:country", (req,res) => {
    var country = req.params.country;
	
	pdb.find({country: country}, (err, pov) => {
		pov.forEach(i => {
			delete i._id;
		});
		res.send(JSON.stringify(pov, null, 2));    
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
		pov.forEach(i => {
			delete i._id;
		});
		res.send(JSON.stringify(pov[0], null, 2)); 
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
	
	
	
	else if (newStat== "" || 
		(newStat.country==null || newStat.country=="") ||
		(newStat.year==null || newStat.year=="") || 
        (newStat.poverty_prp==null || newStat.poverty_prp=="") || 
		(newStat.poverty_pt==null || newStat.poverty_pt=="") || 
		(newStat.poverty_ht==null || newStat.poverty_ht=="")){
	  
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
	
	if(country != nCont || year != nYear){
		res.sendStatus(409, "POVERTY CONFLICT");
	}else{
		pdb.update({country: country, year: year}, 
				  	{$set: {poverty_prp: upd.poverty_prp,  poverty_pt: upd.poverty_pt,  poverty_ht: upd.poverty_ht}});
		res.sendStatus(200, "POVERTY MODIFIED");
	}
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
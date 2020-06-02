module.exports = function(app,BASE_PATH){
const request = require("request");
const path = require("path");
const dataStore = require("nedb");
	
////////////// BASE DE DATOS //////////////
const emigrantsdb = path.join(__dirname, "emigrants-stats.db");
	
const edb = new dataStore({
        filename: emigrantsdb,
        autoload: true
    });

////////////////////////////
///////////DATOS////////////
////////////////////////////
	
var emigrants_stats = [
	
	{country:"italy",year:2017,em_man:1588733,em_woman:1440435,em_totals:3029168},
	{country:"spain",year:2017,em_man:609615,em_woman:736247,em_totals:1345862},
	{country:"germany",year:2017,em_man:1934294,em_woman:2273789,em_totals:4208083},
	{country:"unitedKingdom",year:2017,em_man:2449446,em_woman:2471863,em_totals:4921309},
	{country:"france",year:2017,em_man:1068275,em_woman:1138938,em_totals:2207213},
	
	{country:"italy",year:2015,em_man:1416897,em_woman:1275167,em_totals:2692064},
	{country:"spain",year:2015,em_man:579112,em_woman:691908,em_totals:1271020},
	{country:"germany",year:2015,em_man:1749064,em_woman:2007072,em_totals:3756136},
	{country:"unitedKingdom",year:2015,em_man:2048936,em_woman:1979345,em_totals:4028281},
	{country:"france",year:2015,em_man:1033824,em_woman:1101224,em_totals:2135048},
	
	{country:"italy",year:2010,em_man:1332956,em_woman:1230383,em_totals:2563339},
	{country:"spain",year:2010,em_man:489494,em_woman:597058,em_totals:1086552},
	{country:"germany",year:2010,em_man:1734554,em_woman:1992779,em_totals:3727333},
	{country:"unitedKingdom",year:2010,em_man:2237000,em_woman:2213254,em_totals:4450254},
	{country:"france",year:2010,em_man:943996,em_woman:1013973,em_totals:1957969}
	
];

//////////// PROXY///////////////

var eproxy = "/api/v2/fires-stats";
var urlEProxy = "http://sos1920-23.herokuapp.com/"

app.use(eproxy, function(req, res){
	var url = urlEProxy + req.baseUrl + req.url;
	console.log("piped: " + req.baseUrl + req.url);
	req.pipe(request(url)).pipe(res)
})	


/////////////////////////////////
/////////LoadInitialData/////////
/////////////////////////////////

//GET /api/v1/emigrants-stats-/loadInitialData
app.get(BASE_PATH+"/emigrants-stats/loadInitialData", (req, res) => {	
	
		edb.remove({}, { multi: true });
		edb.insert(emigrants_stats);
		res.sendStatus(200,"ok");
		console.log("Initial emigrants_stats loaded:" +JSON.stringify(emigrants_stats,null,2));
});
///////////////////////////
////////POSTMAN GET////////
///////////////////////////

//////////////////////////////////////////////////////////////// GET /api/v1/emigrants-stats
app.get(BASE_PATH+"/emigrants-stats",(req,res) =>{
    console.log("New GET .../emigrants-stats");
	
	var limit = parseInt(req.query.limit);
	var offset = parseInt(req.query.offset);
	var search = {};
	
	if(req.query.country) search['country'] = req.query.country;
	if(req.query.year) search['year'] = parseInt(req.query.year);
	
	//////// em_man ////////
	if(req.query.em_manMin && req.query.em_manMax)
		search['em_man'] = {
			$gte: parseInt(req.query.em_manMin),
			$lte: parseInt(req.query.em_manMax)}
	if(req.query.em_manMin && !req.query.em_manMax)
		search['em_man'] = {$gte: parseInt(req.query.em_manMin)};
	if(!req.query.em_manMin && req.query.em_manMax)
		search['em_man'] = {$lte: parseInt(req.query.em_manMax)}
	
	//////// em_woman ////////
	if(req.query.em_womanMin && req.query.em_womanMax)
		search['em_woman'] = {
			$gte: parseInt(req.query.em_womanMin),
			$lte: parseInt(req.query.em_womanMax)}
	if(req.query.em_womanMin && !req.query.em_womanMax)
		search['em_woman'] = {$gte: parseInt(req.query.em_womanMin)};
	if(!req.query.em_womanMin && req.query.em_womanMax)
		search['em_woman'] = {$lte: parseInt(req.query.em_womanMax)}
	
	//////// em_totals ////////
	if(req.query.em_totalsMin && req.query.em_totalsMax)
		search['em_totals'] = {
			$gte: parseInt(req.query.em_totalsMin),
			$lte: parseInt(req.query.em_totalsMax)}
	if(req.query.em_totalsMin && !req.query.em_totalsMax)
		search['em_totals'] = {$gte: parseInt(req.query.em_totalsMin)};
	if(!req.query.em_totalsMin && req.query.em_totalsMax)
		search['em_totals'] = {$lte: parseInt(req.query.em_totalsMax)}

	
    edb.find(search).skip(offset).limit(limit).exec(function(error, emi) { 
		emi.forEach((e)=>{
            delete e._id
        });
		
		if(emi == 0){
			res.sendStatus(404, "EMI NOT FOUND");
		}else{
			res.send(JSON.stringify(emi, null, 2));
			console.log("Data send: "+JSON.stringify(emi, null,2));
		}	    
    });
});
	
//////////////////////////////////////////////////////////////// GET /api/v1/emigrants-stats/country
app.get(BASE_PATH+"/emigrants-stats/:country", (req,res) => {
    var country = req.params.country;

	edb.find({country: country}, (err, emi) => {
		
		if(emi.length==0){
		   	console.log("ERROR 404. NOT FOUND");
			res.sendStatus(404);
		 }
		
		else{		
		
			emi.forEach(e => {
			delete e._id;	
			});
			res.send(JSON.stringify(emi, null, 2)); //En este get me saca un objeto no el array de los objetos
		}
	});		
});
////////////////////////////////////////////////////////// GET /api/v1/emigrants-stats/country/year
app.get(BASE_PATH+"/emigrants-stats/:country/:year", (req,res) => {
    var country = req.params.country;
	var year = parseInt(req.params.year);
	
	edb.find({country: country, year: year}, (err, emi) => {
		
		if(emi.length==0){
		   	console.log("ERROR 404. NOT FOUND");
			res.sendStatus(404);
		 }
		
		else{		
		
			emi.forEach(e => {
			delete e._id;	
			});
			res.send(JSON.stringify(emi[0], null, 2)); //En este get me saca un objeto no el array de los objetos
		}
	});		
});

///////////////////////////
////////POSTMAN POST///////
///////////////////////////

//////////////////////////////////////////////////////// POST /api/v1/emigrants-stats
app.post(BASE_PATH+"/emigrants-stats", (req,res) => {
	
	var newStat = req.body;
	
	edb.find({country: newStat.country, year: newStat.year},(error, emi)=>{
		if(emi.length != 0){	
			console.log("409. conflict, el objeto ya existe");
			res.sendStatus(409);
		}
	
	
		else if((newStat == "") || 
		   (newStat.country == null) || (newStat.country == "") ||
		   (newStat.year == null) || (newStat.year == "") ||
		   (newStat.em_man == null) || (newStat.em_man == "") ||
		   (newStat.em_woman == null) || (newStat.em_woman == "") ||					
		   (newStat.em_totals == null) || (newStat.em_totals == "")) {
			
			res.sendStatus(400,"Bad request");
		}	

		else {
			edb.insert(newStat);	
			res.sendStatus(201,"Created");
		}	
	});
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

	edb.find({country: country}, (err, emi) => {
		emi.forEach(e => {
			edb.remove({country : e.country},{});
		});
	});	
	res.sendStatus(200, "EMI REMOVED");
});


//////////////////////////////////////////////////////// Delete /api/v1/emigrants-stats/country/year

app.delete(BASE_PATH+"/emigrants-stats/:country/:year",(req,res)=>{
	
	var country = req.params.country;
	var year = parseInt(req.params.year);

	edb.remove({country: country, year: year}, {});
	res.sendStatus(200, "EMI REMOVED");
		
});
//////////////////////////////////////////////////////// Delete /api/v1/emigrants-stats
app.delete(BASE_PATH+"/emigrants-stats",(req,res)=>{
	
		edb.remove({},{multi:true});
		res.sendStatus(200,"Ok");
	
});

////////////////////////
//////POSTMAN PUT///////
////////////////////////

/////////////////////////////////////////////////////// Put Recurso concreto
app.put(BASE_PATH+"/emigrants-stats/:country/:year", (req, res) =>{
	var country=req.params.country;
	var year=parseInt(req.params.year);
	var upd=req.body;
	var nCont = upd.country;
	var nYear = parseInt(upd.year);
	
	edb.find({"country":country, "year": year},(error,emi)=>{
		console.log(emi);
		if(emi.length == 0){
			console.log("Error 404, recurso no encontrado.");
			res.sendStatus(404);
		}else if(!nCont || !nYear || !upd.em_man||!upd.em_woman||!upd.em_totals||country != nCont || year != nYear){
			res.sendStatus(409, "EMIGRANT CONFLICT");
		}else{
			edb.update({country: country, year: year}, 
						  {$set: upd});
			res.sendStatus(200, "EMIGRANT MODIFIED");
		}
	
	});
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
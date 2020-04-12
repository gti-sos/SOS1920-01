module.exports = function(app,BASE_PATH){
	
	const dataStore = require("nedb");
	const path = require("path");
	
	const dbnatality = path.join(__dirname, "natality-stats.db");
	const dbn = new dataStore({
		filename: dbnatality,
		autoload: true,
		autoload: true,
		autoload: true,
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

// --------------- loadInitialData ----------------------
 app.get(BASE_PATH + "/natality-stats/loadInitialData", (req, res) => {
	 dbn.insert(initialNatality_stats);
	 res.sendStatus(200);
	 console.log("Initial natality_stats loaded:" +JSON.stringify(initialNatality_stats,null,2));
 });


// ------------- GET natality_stats -------------------------
app.get(BASE_PATH+"/natality-stats",(req,res) => {
	
	console.log("New GET .../natality_stats");
	dbn.find({}, (error, initialNatality_stats) => { //dejamos la QUERY vacía para que devuelva todos los objetos.
		initialNatality_stats.forEach((i)=>{
				delete i._id
			});
		//natality_stats.forEach( (c) =>{
		//	delete c."la variable que queremos borrar"; 		
	//})
		res.send(JSON.stringify(initialNatality_stats,null,2));
	});  
});

// -------------- GET natality_stats country para un elemento concreto -------
///api/v1/natality_stats/country
app.get(BASE_PATH+"/natality-stats/:country", (req,res) => {
    var country = req.params.country;
    var natality = initialNatality_stats.filter((c) => {
		return (c.country == country);
		
		dbn.find({ "country" :country}, (error, natality) => {
		 if(natality.length >= 1){
        	res.send(natality);
   		 }else{
        res.sendStatus(404,"NOT FOUND");
		 }
		});
	});
});
//----------  GET /api/v1/emigrants-stats/country/year en este caso también filtramos por año
app.get(BASE_PATH+"/natality-stats/:country/:year", (req,res) => {
    var country = req.params.country;
    var year = req.params.year;

    var natalityC = initialNatality_stats.filter((c) => {
		return (c.country == country);
	});
    var natalityY = initialNatality_stats.filter((y) => {
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
// ---------------- POST natality_stats crea un nuevo recurso-----------------------
	app.post(BASE_PATH + "/natality-stats", (req, res) => {
		var newNat = req.body;
		var countryNewNat = req.body.country;
		var yearNewNat = req.body.year;
		
		var filteredStats = initialNatality_stats.filter((c) => {
            return (c.country == countryNewNat && c.year == yearNewNat);
        });
        if((newNat == "") || (newNat.country == null) || (newNat.year == null) || (newNat.natality_totals == null) || (newNat.natality_men == null) || newNat.natality_women == null){
            res.sendStatus(400,"BAD REQUEST");
        } else if(filteredStats.length >= 1){
            res.sendStatus(409,"CONFLICT");
        } else {
            initialNatality_stats.push(newNat);
            res.sendStatus(201,"CREATED");
        }
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

// ------- DALETE natality_stats/country borramos un recurso concreto.
app.delete(BASE_PATH + "/natality-stats/:country", (req, res) =>{
	
	var country = req.params.country;
	
	var filteredNatality = initialNatality_stats.filter((c) => {
		return (c.country != country);
		
	});

	if(filteredNatality.length < initialNatality_stats.length){
		initialNatality_stats = filteredNatality;
		res.sendStatus(200);
	}else{
		res.sendStatus(404,"NATALITY NOT FOUND")
	}
});
// ------- DALETE natality_stats/country/year borramos a un pais de un determinado año
app.delete(BASE_PATH + "/natality-stats/:country/:year", (req,res) =>{
	
	var country = req.params.country;
	var year = req.params.year;
	
	var natalityC = initialNatality_stats.filter((c) => {
		return (c.country != country || c.year != year)
	});
	
	if(natalityC.length < initialNatality_stats.length) {
		
	   initialNatality_stats = natalityC;
	   res.sendStatus(200, "OK");
	   }else{
		   res.endStatus(404,"NOT FOUND");
		}
});

//  -------------DELETE borra todos los recursos -----
app.delete(BASE_PATH+"/natality-stats",(req,res)=>{
	
		dbn.remove({},{multi:true});
		res.sendStatus(200,"Ok");
		console.log("Todos los recursos borrados.");
	
});


 // ------------- PUT /natality_stats ---------
app.put(BASE_PATH+"/natality_stats/:country/:year", (req, res) =>{
	
	var country=req.params.country;
	var year=req.params.year;
	var upd=req.body;
	var filter = initialNatality_stats.filter((f) => {
		return (f.country == country && f.year == year);
		});
	
		if(filter.length != 1){
			res.sendStatus(404,"NOT FOUND");
		}else if(filter[0].country != upd.country || filter[0].year != upd.year){
			res.sendStatus(409,"CONFLICT, countries and years are diferent");
		}else{
			initialNatality_stats.forEach(c => {
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
	app.put(BASE_PATH+"/natality-stats",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});

///PUT ERROR General /natality_stats/country para un país determinado
	app.put(BASE_PATH+"/natality-stats/:country",(req,res) =>{
		res.sendStatus(405,"Method not allowed");
	});

}
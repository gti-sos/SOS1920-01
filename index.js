const express = require ("express");
const bodyParser = require("body-parser");

var app = express();

app.use("/",express.static("./public")); 
app.use(bodyParser.json());

app.use("/",express.static("./public")); 


var port = process.env.PORT || 80;
const BASE_API_USE = "/api/v1";

app.get("/public",(request,response) => {
	response.send("index.html");
});

//-------------- API Juanfran -----------
var natality_stats = [
	{//2017
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
	{//2015
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
	{//2010
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

// --------------- get loadInitialData ----------------------
 app.get(BASE_API_USE + "/natality-stats/loadInitialData", (req, res) => {
	 var natality_stats = [
	{//2017
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
	{//2015
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
	{//2010
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

// ---------------- POST natality_stats --------------------------------
	app.post(BASE_API_USE + "/natality-stats", (req, res) => {
		var newNat = req.body;
		if((newNat == "") || (newNat.country == null) || (newNat.year == null)
		  || (newNat.natality_totals == null) || (newNat.natality_men) || 				          (newNat.natality_women == null)){
			res.sendStatus(400, "BAD REQUEST");
		}else{
			natality_stats.push(newNat);
			res.sendStatus(201,"CREATE");
		}
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

//---------- /api/v1/emigrants-stats/country/year en este caso también filtramos por año
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

//

console.log("Server already");
app.listen(port,() => {
		console.log("Server start");
});

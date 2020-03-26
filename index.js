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
///////////////////////////  URL  //////////////////////////////////


///////////////////////////  DATOS  //////////////////////////////////

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

///////////////////////////  POSTMAN GET  //////////////////////////////////

app.get(BASE_API_USE+"/poverty-stats",(req,res) =>{

    res.send(JSON.stringify(poverty_stats,null,2));
});

/*//GET https://angtorcal.run-eu-central1.goorm.io/api/v1/poverty-stats/loadInitialData
    app.get(BASE_API_USE+"/poverty-stats/loadInitialData", (req, res) => {
        poverty_stats.find({}).toArray((err, poverty_stats_a)=>{
            if(err)
                console.log("Error: "+ err);
            if(poverty_stats_a.length == 0) {
                poverty_stats.insert({country: "spain",year: 2010,poverty_prp:9551, poverty_pt:8763,poverty_ht:18402});
                poverty_stats.insert({country: "germany",year: 2010,poverty_prp:12648, poverty_pt:11278,poverty_ht:23684});
                poverty_stats.insert({country: "italy",year: 2010,poverty_prp:11124, poverty_pt:9578,poverty_ht:20115});
				poverty_stats.insert({country: "france",year: 2010,poverty_prp:8112, poverty_pt:11976,poverty_ht:25150});
				poverty_stats.insert({country: "united kingdom",year: 2010,poverty_prp:10519, poverty_pt:10263,poverty_ht:21553});
				
				poverty_stats.insert({country: "spain",year: 2015,poverty_prp:10178, poverty_pt:8011,poverty_ht:16823});
				poverty_stats.insert({country: "germany",year: 2015,poverty_prp:13428, poverty_pt:12401,poverty_ht:26041});
				poverty_stats.insert({country: "italy",year: 2015,poverty_prp:12130, poverty_pt:9508,poverty_ht:19966});
				poverty_stats.insert({country: "france",year: 2015,poverty_prp:8474, poverty_pt:12849,poverty_ht:26983});
				poverty_stats.insert({country: "united kingdom",year: 2015,poverty_prp:10648, poverty_pt:12617,poverty_ht:26495});
				
				poverty_stats.insert({country: "spain",year: 2017,poverty_prp:9950, poverty_pt:8522,poverty_ht:17896});
				poverty_stats.insert({country: "germany",year: 2017,poverty_prp:13428, poverty_pt:12401,poverty_ht:26041});
				poverty_stats.insert({country: "italy",year: 2017,poverty_prp:12130, poverty_pt:9508,poverty_ht:19966});
				poverty_stats.insert({country: "france",year: 2017,poverty_prp:8474, poverty_pt:12849,poverty_ht:26983});
				poverty_stats.insert({country: "united kingdom",year: 2017,poverty_prp:10648, poverty_pt:12617,poverty_ht:26495});
               
                res.sendStatus(201);   
            }else{
                res.sendStatus(409);
            }
        });
    });
*/
///////////////////////////  SERVIDOR  //////////////////////////////////

app.listen(port,() => {
	
		console.log("Server start");
	
	});
console.log("Starting server...");






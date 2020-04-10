
const express = require ("express");
const bodyParser = require("body-parser");
const app = express();
const BASE_PATH = "/api";
const dataStore = require("nedb");
const path = require("path");
const port = process.env.PORT || 80;

/*const dbFileName = path.join(__dirname, "natality-stats.db");//el método join permite unir un directorio con un archivo.
const db = new dataStore({
				filename: dbFileName,
				autoload: true
			});*/

const emigrantsdb = path.join(__dirname, "emigrants-stats.db");
const edb = new dataStore({
				filename: emigrantsdb,
				autoload: true
			});

app.use("/",express.static("./public")); 
app.use(bodyParser.json());

app.get("/public",(request,response) => {
    response.send("index.html");
});


//////////////////// Antonio Escobar Núñez ////////////////////
var apiEscobar = require("./api-escobar");
apiEscobar(app,BASE_PATH);

/////////////////// API JUANFRAN //////////////
var apijuanfran = require("./api-juanfran");
apijuanfran(app, BASE_PATH);

/////////////////// API ANGELA //////////////
var api_angela= require("./api-angela");
api_angela(app, BASE_PATH);

//////////////////// Servidor ////////////////////

console.log("Server already");
app.listen(port,() => {
        console.log("Server start");
});



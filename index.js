const express = require ("express");
const bodyParser = require("body-parser");
<<<<<<< HEAD
const BASE_PATH = "/api";
const path = require("path");
=======
const dataStore = require("nedb");
const path = require("path");

const dbFileName = path.join(__dirname, "natality-stats.db");//el método join permite unir un directorio con un archivo.
const db = new dataStore({
				filename: dbFileName,
				autoload: true
			});


const BASE_PATH = "/api";
>>>>>>> 7ab7c33a47563d75edd70a60715d17e9dd32c0b7
const app = express();
const port = process.env.PORT || 80;

app.use("/",express.static("./public")); 
app.use(bodyParser.json());

app.get("/public",(request,response) => {
    response.send("index.html");
});


//////////////////// Antonio Escobar Núñez ////////////////////
var apiEscobar = require("./api-escobar");
apiEscobar(app,BASE_PATH);

<<<<<<< HEAD
=======
/////////////////// API JUANFRAN //////////////
var apijuanfran = require("./api-juanfran");
apijuanfran(app, BASE_PATH);
//////////////////////////////////////////////
>>>>>>> 7ab7c33a47563d75edd70a60715d17e9dd32c0b7
//////////////////// Servidor ////////////////////

console.log("Server already");
app.listen(port,() => {
        console.log("Server start");
});


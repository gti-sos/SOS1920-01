
const express = require ("express");
const bodyParser = require("body-parser");
const app = express();
const BASE_PATH = "/api";
const port = process.env.PORT || 80;


//const natalitydb = require(path.join(__dirname, "api-juanfran"));
//const emigrantsdb = require(path.join(__dirname, "api-escobar"));
//const povertydb = require(path.join(__dirname, "api-angela"));


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
var apiAngela= require("./api-angela");
apiAngela(app, BASE_PATH);

//////////////////// Servidor ////////////////////

console.log("Server already");
app.listen(port,() => {
        console.log("Server start");
});



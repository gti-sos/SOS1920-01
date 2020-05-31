
const express = require ("express");
const bodyParser = require("body-parser");
var app = express();
const BASE_PATH = "/api";
const cors = require("cors");

const port = process.env.PORT || 9999;

/*app.get("/public",(request,response) => {
    response.send("index.html");
});*/
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use("/",express.static("./public")); 

//////////////////// Antonio Escobar Núñez ////////////////////
var apiEscobar = require("./src/back/api-escobar");
apiEscobar(app,BASE_PATH);

/////////////////// API JUANFRAN //////////////
var apijuanfran = require("./src/back/api-juanfran");
apijuanfran(app, BASE_PATH);

/////////////////// API ANGELA //////////////
var api_angela = require("./src/back/api-angela");
api_angela(app, BASE_PATH);

const povertyAPIv2 = require("./src/back/api-angela/v2");
povertyAPIv2(app);
//////////////////// Servidor ////////////////////

console.log("Server already");
app.listen(port,() => {
        console.log("Server start");
});



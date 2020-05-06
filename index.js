
const express = require ("express");
const bodyParser = require("body-parser");
const app = express();
const BASE_PATH = "/api";

const port = process.env.PORT || 9999;

app.use("/",express.static("./public")); 
app.use(bodyParser.json());

app.get("/public",(request,response) => {
    response.send("index.html");
});


//////////////////// Antonio Escobar Núñez ////////////////////
var apiEscobar = require("./src/back/api-escobar");
apiEscobar(app,BASE_PATH);



/////////////////// API JUANFRAN //////////////
var apijuanfran = require("./src/back/api-juanfran");
apijuanfran(app, BASE_PATH);


/////////////////// API ANGELA //////////////
var api_angela = require("./src/back/api-angela");
api_angela(app, BASE_PATH);

//////////////////// Servidor ////////////////////

console.log("Server already");
app.listen(port,() => {
        console.log("Server start");
});



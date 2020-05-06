
const express = require ("express");
const bodyParser = require("body-parser");
const app = express();
const BASE_PATH = "/api";


const port = process.env.PORT || 9999;


//const natalitydb = require(path.join(__dirname, "api-juanfran"));//el método join permite unir un directorio con un archivo.


app.use("/",express.static("./public")); 
app.use(bodyParser.json());

app.get("/public",(request,response) => {
    response.send("index.html");
});


//////////////////// Antonio Escobar Núñez ////////////////////
var apiEscobarv1 = require("./src/back/api-escobar/v1");
var apiEscobarv2 = require("./src/back/api-escobar/v2");
apiEscobarv1(app,BASE_PATH);
apiEscobarv2(app,BASE_PATH);


/////////////////// API JUANFRAN //////////////
var apijuanfranv1 = require("./src/back/api-juanfran/v1");
var apijuanfranv2 = require("./src/back/api-juanfran/v2");
apijuanfranv1(app, BASE_PATH);
apijuanfranv2(app, BASE_PATH);

/////////////////// API ANGELA //////////////
var api_angelav1 = require("./src/back/api-angela/v1");
var api_angelav2 = require("./src/back/api-angela/v2");
api_angelav1(app, BASE_PATH);
api_angelav2(app, BASE_PATH);

//////////////////// Servidor ////////////////////

console.log("Server already");
app.listen(port,() => {
        console.log("Server start");
});



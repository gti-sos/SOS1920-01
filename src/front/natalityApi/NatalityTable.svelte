<script>
    import{
        onMount
    } from "svelte";
    import Table from "sveltestrap/src/Table.svelte";
    import Button from "sveltestrap/src/Button.svelte";
 
    import {Pagination, PaginationItem, PaginationLink} from "sveltestrap";
    import FormGroup from "sveltestrap/src/FormGroup.svelte";
    import Input from "sveltestrap/src/Input.svelte";
    
    let natalitystats = [];
    let newNatalitystats = {
        country: "",
        year: "",
        natalityTotals: "",
        natalityMen: "",
        natalityWomen: ""
    };

    //PAGINACION
    let numberElementsPages = 10;
	let offset = 0;
	let currentPage = 1;
    let moreData = true;
    
    //VARIABLES PARA LA BUSQUEDA
    let campo = "";
    let value = "";

    //ALERTA
    let exitoMensaje; //o con window.alert

    onMount(getNatalitystats);

    //FUNCIONES
    async function loadInitialData(){
		console.log("Uploading natality-stats . . .");
		const res = await fetch("/api/v2/natality-stats/loadInitialData",{
			method: "GET"
		}).then(function(res){
			window.alert("Pulsa 'Aceptar' para cargar todos los datos");
			getNatalitystats();
		});
	}
    async function getNatalitystats(){
        console.log("Fetching natality-stats...");
        const res = await fetch("/api/v2/natality-stats?offset=" + numeroRecursos * offset + "&limit=" + numeroRecursos);
        const resNext = await fetch("/api/v2/natality-stats?offset="  + numeroRecursos * (offset + 1) + "&limit=" + numeroRecursos);

        if(res.ok && resNext.ok){
            console.log("Ok");
            const json = await res.json();
			const jsonNext = await resNext.json();
            natalitystats = json;
			
			if (jsonNext.length == 0) {
				moreData = false;
			} else {
				moreData = true;
			}
            console.log("Received " + natalitystats.length + " natality-stats.");
        } else if(res.status == 404) {
            console.log("¡ERROR!");
            window.alert("No existe ningun dato");
        }
    }

    //INSERTAR DATOS
    async function insertNatalitystats(){
        exitoMensaje = "";
        console.log("Insertin natality stats ...");
        const res = await fetch("/api/v2/natality-stats", {
                method: "POST",
                body: JSON.stringify(newNatalitystats),
                headers: {
                    "Content-type": "application/json"
                }
            }).then(function(res){
                getNatalitystats();
                    if(res.ok){
                        newNatalitystats = {
                            country: "",
                            year: "",
                            natalityTotals: "",
                            natalityMen: "",
                            natalityWomen: ""
                        };
                        exitoMensaje = res.status + ": " + res.statusText + "El dato ha sido insertado con éxito";
                }else if (res.status == 400){
                    window.alert("ERROR: Debe de rellenar los campos.");
                }else if(res.status == 409){
                    window.alert("ERROR: El dato ya existe.");
                }
            });
    }
    //ELIMINAR TODO
    async function deleteNatalitystats(){
		console.log("Deleting all natalitystats . . .");
		const res = await fetch("/api/v2/natalitystats/",{
			method: "DELETE"
		}).then(function(res){
			if (res.ok) {
			getNatalitystats();
			location.reload();//autorecarga para la alerta
			window.alert("Pulsa el botón 'Aceptar' para eliminar todos los datos");
		}else if(res.status == 404){
			window.alert("ERROR al borrar los elementos");
		}else{
			window.alert("ERROR interno del servidor");
		}
		});
	}
    //ELIMINAR STATS EN CONCRETO
    async function deleteNatalitystat(country,year){
        console.log("Deleting natality-stats ...");
		const res = await fetch("/api/v2/natality-stats/" + country + "/" + year, {
			method: "DELETE"
		}).then(function(res){
			if (res.ok) {
			getNatalitystats();
			window.alert("El Dato ha sido eliminado con éxito");
		}else if(res.status == 404){
			window.alert("Se ha intentado borrar algo no existente");
		}else{
			window.alert("Error interno del servidor");
		}
		});
    }

    //OFFSET
    async function incrementOffset(value){
		offset += value;
		currentPage += value;
		getNatalitystats();
	}

    //BUSQUEDAS
    async function search(campo, value){
		console.log("Searching natality-stats: " + campo + "/" + value);
		var url = "/api/v2/natality-stats";
		if (campo != "" && value!= ""){
			url = url + "?" + campo + "=" + value;
		}
		console.log(url);
		const res = await fetch(url);
		if (res.ok){
			console.log("Ok");
			const json = await res.json();
			accstats = json;
			console.log("Found" + natalitystats.length + "natality-stats");
		}else if(res.status == 404){
			window.alert("No se encuentra el dato busquado");
			console.log("ERROR");
		}else{
			console.log("ERROR");
		}
    }
</script>

<main>
    <h1 style="text-align: center"> NATALIDAD </h1>

      <Table>
          <thead>
              <tr>
                  <th>País</th>
                  <th>Año</th>
                  <th>Total de nacimientos</th>
                  <th>Nacimiento de hombre</th>
                  <th>Nacimiento de mujer</th>
              </tr>
          </thead>
          <tbody>
              <tr>
                <td><input type = "text" bind:value="{newNatalitystats.country}"></td>
				<td><input type = "number" bind:value="{newNatalitystats.year}"></td>
				<td><input type = "number" bind:value="{newNatalitystats.natalityTotals}"></td>
				<td><input type = "number" bind:value="{newNatalitystats.natalityMen}"></td>
				<td><input type = "number" bind:value="{newNatalitystats.natalityWomen}"></td>
				<td> <Button color="primary" on:click={insertNatalitystats}><i class="fas fa-plus-circle"></i> Insertar dato</Button></td>
              </tr>
              {#each natalitystats as natalitystat}
			<tr>
				<td>
					<a href="#/natalitystat/{natalitystat.country}/{natalitystat.year}">{natalitystat.country}</a>
				</td>
				<td>{natalitystat.year}</td>
				<td>{natalitystat.natalityTotals}</td>
				<td>{natalitystat.natalityMen}</td>
				<td>{natalitystat.natalityWomen}</td>
				<td><Button color="danger" on:click={deleteNatalitystats(natalitystat.country, natalitystat.year)}><i class="fas fa-minus-circle"></i> Eliminar dato</Button></td>
			</tr>
			{/each}
          </tbody>
      </Table>
</main>
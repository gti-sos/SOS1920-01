<script>
	import {
		onMount
	} from "svelte";
	import Table from "sveltestrap/src/Table.svelte";
	import Button from "sveltestrap/src/Button.svelte";
	let stats = [];
	let newStat = {
		country : "",
		year : "",
		poverty_prp : "",
		poverty_pt : "",
		poverty_ht : ""
	};
	let numeroDePagina = 0;
	let numeroAux;
	let limit = 10;
	let searchCountry = "";
	let searchYear = "";
	let minPoverty_prp = "";
	let maxPoverty_prp = "";
	let minPoverty_pt = "";
	let maxPoverty_pt = "";
	let minPoverty_ht = "";
	let maxPoverty_ht = "";
	let errorMsg = "";
	let exitoMsg ="";
	
	onMount(getStats);
	async function getStats(){
		console.log("Fetching stats....");
		const res = await fetch("/api/v2/poverty-stats?offset="+numeroDePagina+"&limit="+limit);
		if(res.ok){
			console.log("Ok:");
			const json = await res.json();
			stats = json;
			console.log("Received "+stats.length+" stats.");
		}else{
			console.log("ERROR");
		};
	};
	async function busqueda(searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht){
		if(typeof searchCountry=='undefined'){
			searchCountry="";
		}
		if(typeof searchYear=='undefined'){
			searchYear="";
		}
		if(typeof minPoverty_prp=='undefined'){
			minPoverty_prp="";
		}
		if(typeof maxPoverty_prp=='undefined'){
			maxPoverty_prp="";
		}
		if(typeof minPoverty_pt=='undefined'){
			minPoverty_pt="";
		}
		if(typeof maxPoverty_pt=='undefined'){
			maxPoverty_pt="";
		}
		if(typeof minPoverty_ht=='undefined'){
			minPoverty_ht="";
		}
		if(typeof maxPoverty_ht=='undefined'){
			maxPoverty_ht="";
		}
		const res = await fetch("/api/v2/poverty-stats?country="+searchCountry+"&year="+searchYear+"&poverty_prpMax="+maxPoverty_prp+"&poverty_prpMin="+minPoverty_prp+"&poverty_ptMax="+maxPoverty_pt+"&poverty_ptMin="+minPoverty_pt+"&poverty_htMax="+maxPoverty_ht+"&poverty_htMin="+minPoverty_ht)
		if (res.ok){
			const json = await res.json();
			stats = json;
			console.log("Found "+ stats.length + " stats");
			window.alert("Se han encontrado datos.");
		}else if(res.status==404){
				window.alert("No se encuentran datos.");
		}else{
			console.log("ERROR:"+" El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText);
		};
	}
	async function paginacion(searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht,num){
		numeroAux=num;
		if(typeof searchCountry=='undefined'){
			searchCountry="";
		}
		if(typeof searchYear=='undefined'){
			searchYear="";
		}
		if(typeof minPoverty_prp=='undefined'){
			minPoverty_prp="";
		}
		if(typeof maxPoverty_prp=='undefined'){
			maxPoverty_prp="";
		}
		if(typeof minPoverty_pt=='undefined'){
			minPoverty_pt="";
		}
		if(typeof maxPoverty_pt=='undefined'){
			maxPoverty_pt="";
		}
		if(typeof minPoverty_ht=='undefined'){
			minPoverty_ht="";
		}
		if(typeof maxPoverty_ht=='undefined'){
			maxPoverty_ht="";
		}
		if(num==1){
			numeroDePagina=numeroDePagina-limit;
			if(numeroDePagina<0){
				numeroDePagina=0;
				const res = await fetch("/api/v2/poverty-stats?country="+searchCountry+"&year="+searchYear+"&poverty_prpMax="+maxPoverty_prp+"&poverty_prpMin="+minPoverty_prp+"&poverty_ptMax="+maxPoverty_pt+"&poverty_ptMin="+minPoverty_pt+"&poverty_htMax="+maxPoverty_ht+"&poverty_htMin="+minPoverty_ht+"&limit="+limit+"&offset="+numeroDePagina)
				if (res.ok){
					const json = await res.json();
					stats = json;
					numeroAux=num;
					
				}
			}else{
				const res = await fetch("/api/v2/poverty-stats?country="+searchCountry+"&year="+searchYear+"&poverty_prpMax="+maxPoverty_prp+"&poverty_prpMin="+minPoverty_prp+"&poverty_ptMax="+maxPoverty_pt+"&poverty_ptMin="+minPoverty_pt+"&poverty_htMax="+maxPoverty_ht+"&poverty_htMin="+minPoverty_ht+"&limit="+limit+"&offset="+numeroDePagina)
				if (res.ok){
					const json = await res.json();
					stats = json;
					numeroAux=num;
				}
			}
		}else{
			numeroDePagina = numeroDePagina+limit;
			const res = await fetch("/api/v2/poverty-stats?country="+searchCountry+"&year="+searchYear+"&poverty_prpMax="+maxPoverty_prp+"&poverty_prpMin="+minPoverty_prp+"&poverty_ptMax="+maxPoverty_pt+"&poverty_ptMin="+minPoverty_pt+"&poverty_htMax="+maxPoverty_ht+"&poverty_htMin="+minPoverty_ht+"&limit="+limit+"&offset="+numeroDePagina)
			if (res.ok){
					const json = await res.json();
					stats = json;
					numeroAux=num;
			}
		}
	}
	async function getStatsPov(){
		console.log("Fetching stats...");
		const res = await fetch("/api/v2/poverty-stats");
		if(res.ok){
			console.log("Ok:");
			const json = await res.json();
			stats = json;
			console.log("Received "+stats.length+" stats.");
		}else{
			window.alert("No se encuentra ningún dato.");
			errorMsg =" El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText;
			console.log("ERROR!");
		}
	}
	async function loadInitialData(){
		console.log("Loading stats...");
		const res = await fetch("/api/v2/poverty-stats/loadInitialData",{
			method: "GET"
		}).then(function(res){
			if(res.ok){
				getStatsPov();
				window.alert("Datos iniciales cargados.");
			}else if(res.status==401){
				window.alert("La base de datos no está vacía. Debe vaciarla para cargar los datos iniciales");
			}else{
				errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText;
				console.log("ERROR!");
			}
            
			
		});
	}
	async function insertStat(){
		exitoMsg ="";
		console.log("Inserting stat...");
		if (newStat.country == "" || newStat.country == null || newStat.year == "" || newStat.year == null) {
			window.alert("Pon un país y un año");
		}else{
			const res = await fetch("/api/v2/poverty-stats",{
				method: "POST",
				body: JSON.stringify(newStat),
				headers:{
					"Content-Type": "application/json"
				}
			}).then(function (res){
				if(res.ok){
					console.log("Ok:");
					getStats();
					window.alert("Dato insertado correctamente.");
					exitoMsg = res.status + ": " + res.statusText + ". Dato insertado con éxito";
				}else if(res.status==400){
					window.alert("Campo mal escrito.No puede insertarlo.");
					errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText;
					console.log("ERROR!");
				}else{
					window.alert("Dato ya creado. No puede insertarlo.");
					errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText;
					console.log("ERROR!");
				}
				
			});
		}
	}
	async function deleteStat(country,year){
		console.log("Deleting stat...");
		const res = await fetch("/api/v2/poverty-stats/"+country+"/"+year,{
			method: "DELETE"
		}).then(function (res){
			window.alert("Dato eliminado correctamente.");
			getStats();
		});
	}
	async function deleteStats(){
		console.log("Deleting stat...");
		const res = await fetch("/api/v2/poverty-stats",{
			method: "DELETE"
		}).then(function (res){
			window.alert("Base de datos eliminada correctamente.");			
			getStatsPov();
			location.reload();
		});
	}
</script>

<main>
	<h3>Vista completa de elementos. </h3>
	{#await stats}
		Loading stats...
	{:then stats}
		<Table bordered>
			<thead>
				<tr>
					<th>País</th>
					<th>Año</th>
					<th>Personas en riesgo de pobreza</th>
					<th>Umbral persona</th>
					<th>Umbral hogar</th>
					<th>Acciones</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><input type = "text" bind:value = "{newStat.country}"></td>
					<td><input type = "number" bind:value = "{newStat.year}"></td>
					<td><input type = "number" bind:value = "{newStat.poverty_prp}"></td>
					<td><input type = "number" bind:value = "{newStat.poverty_pt}"></td>
					<td><input type = "number" bind:value = "{newStat.poverty_ht}"></td>
					<td><Button outline color="primary" on:click={insertStat}>Insertar</Button></td>
				</tr>
				{#each stats as stat}
					<tr>
						<td>
							<a href="#/poverty-stats/{stat.country}/{stat.year}">{stat.country}</a>
						</td>
						<td>{stat.year}</td>
						<td>{stat.poverty_prp}</td>
						<td>{stat.poverty_pt}</td>
						<td>{stat.poverty_ht}</td>
						<td><Button outline color="danger" on:click="{deleteStat(stat.country,stat.year)}">Eliminar</Button></td>
					</tr>
				{/each}
			</tbody>
		</Table>
	{/await}
	{#if errorMsg}
		<p style="color: red">ERROR: {errorMsg}</p>
	{/if}
    {#if exitoMsg}
        <p style="color: green">{exitoMsg}</p>
    {/if}
	<Button outline color="secondary" on:click="{loadInitialData}">Cargar datos iniciales</Button>
	<Button outline color="danger" on:click="{deleteStats}">Borrar todo</Button>
	{#if numeroDePagina==0}
		<Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht, 2)}">&gt</Button>
	{/if}
	{#if numeroDePagina>0}
		<Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht, 1)}">Pagina anterior</Button>
		<Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht, 2)}">Pagina siguiente</Button>
	{/if}
	<h6>Para verlo mediante páginas pulse el botón de avanzar página. </h6>
	<tr>
		<td><label>País: <input bind:value="{searchCountry}"></label></td>
		<td><label>Mínimo de personas en riesgo de pobreza: <input bind:value="{minPoverty_prp}"></label></td>
		<td><label>Mínimo umbral persona: <input bind:value="{minPoverty_pt}"></label></td>
		<td><label>Mínimo umbral hogar: <input bind:value="{minPoverty_ht}"></label></td>
	</tr>
	<tr>
		<td><label>Año: <input bind:value="{searchYear}"></label></td>
		<td><label>Máximo de personas en riesgo de pobreza: <input bind:value="{maxPoverty_prp}"></label></td>
		<td><label>Máximo umbral persona: <input bind:value="{maxPoverty_pt}"></label></td>
		<td><label>Máximo umbral hogar: <input bind:value="{maxPoverty_ht}"></label></td>
	</tr>

	<Button outline color="primary" on:click="{busqueda (searchCountry, searchYear, minPoverty_prp, maxPoverty_prp, minPoverty_pt, maxPoverty_pt, minPoverty_ht, maxPoverty_ht)}">Buscar</Button>
	<h6>Si quiere ver todos los datos después de una búsqueda, quite todo los filtros y pulse el botón de buscar. </h6>
</main>
<script>
	import {
		onMount
	} from "svelte";
	import Table from "sveltestrap/src/Table.svelte";
    import Button from "sveltestrap/src/Button.svelte";
    
	let natalitystats = [];
	let newStat = {
		country : "",
		year : "",
		natality_totals : "",
		natality_men : "",
		natality_women : ""
	};
	let numeroDePagina = 0;
	let numeroAux;
	let limit = 10;
	let searchCountry = "";
	let searchYear = "";
	let natality_totalsMin = "";
	let natality_totalsMax = "";
	let natality_menMin = "";
	let natality_menMax = "";
	let natality_womenMin = "";
	let natality_womenMax = "";
	let errorMsg = "";
	
    onMount(getStats);
    
	async function getStats(){
		console.log("Fetching stats....");
		const res = await fetch("/api/v2/natality-stats?offset="+numeroDePagina+"&limit="+limit);
		if(res.ok){
			console.log("Ok:");
			const json = await res.json();
			natalitystats = json;
			console.log("Received "+natalitystats.length+" stats.");
		}else{
			console.log("ERROR");
		};
	};
    async function busqueda(searchCountry, searchYear, natality_totalsMin, natality_totalsMax, natality_menMin, natality_menMax,
                natality_womenMin, natality_womenMax){
		if(typeof searchCountry=='undefined'){
			searchCountry="";
		}
		if(typeof searchYear=='undefined'){
			searchYear="";
		}
		if(typeof natality_totalsMin=='undefined'){
			natality_totalsMin="";
		}
		if(typeof natality_totalsMax=='undefined'){
			natality_totalsMax="";
		}
		if(typeof natality_menMin=='undefined'){
			natality_menMin="";
		}
		if(typeof natality_menMax=='undefined'){
			natality_menMax="";
		}
		if(typeof natality_womenMin=='undefined'){
			natality_womenMin="";
		}
		if(typeof natality_womenMax=='undefined'){
			natality_womenMax="";
		}
        const res = await fetch("/api/v2/natality-stats?country="+searchCountry+"&year="+searchYear+"&natality_totalsMax="+
        natality_totalsMax+"&natality_totalsMin="+natality_totalsMin+"&natality_menMin="+natality_menMin+"&natality_menMax="+
        natality_menMax+ +"&natality_womenMin="+natality_womenMin + "&natality_womenMax="+natality_womenMax)
		if (res.ok){
			const json = await res.json();
			natalitystats = json;
			console.log("Found "+ natalitystats.length + " stats");
			window.alert("Se han encontrado datos.");
		}else if(res.status==404){
				window.alert("No se encuentran datos.");
		}else{
			console.log("ERROR:"+" El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText);
		};
	}
	async function paginacion(searchCountry, searchYear, natality_totalsMin, natality_totalsMax, natality_menMin, natality_menMax,
                natality_womenMin, natality_womenMax,num){
		Aux=num;
		if(typeof searchCountry=='undefined'){
			searchCountry="";
		}
		if(typeof searchYear=='undefined'){
			searchYear="";
		}
		if(typeof natality_totalsMin=='undefined'){
			natality_totalsMin="";
		}
		if(typeof natality_totalsMax=='undefined'){
			natality_totalsMax="";
		}
		if(typeof natality_menMin=='undefined'){
			natality_menMin="";
		}
		if(typeof natality_menMax=='undefined'){
			natality_menMax="";
		}
		if(typeof natality_womenMin=='undefined'){
			natality_womenMin="";
		}
		if(typeof natality_womenMax=='undefined'){
			natality_womenMax="";
		}
		if(num==1){
			numeroDePagina=numeroDePagina-limit;
			if(numeroDePagina<0){
				numeroDePagina=0;
                const res = await fetch("/api/v2/natality-stats?country="+searchCountry+"&year="+searchYear+"&natality_totalsMax="+
                    natality_totalsMax+"&natality_totalsMin="+natality_totalsMin+"&natality_menMin="+natality_menMin+
                    "&natality_menMax="+
                    natality_menMax+ +"&natality_womenMin="+natality_womenMin + "&natality_womenMax="+
                    natality_womenMax+"&limit="+limit+"&offset="+numeroDePagina)
				if (res.ok){
					const json = await res.json();
					natalitystats = json;
					Aux=num;
					
				}
			}else{
				const res = await fetch("/api/v2/natality-stats?country="+searchCountry+"&year="+searchYear+"&natality_totalsMax="+
                    natality_totalsMax+"&natality_totalsMin="+natality_totalsMin+"&natality_menMin="+natality_menMin+
                    "&natality_menMax="+
                    natality_menMax+ +"&natality_womenMin="+natality_womenMin + "&natality_womenMax="+
                    natality_womenMax+"&limit="+limit+"&offset="+numeroDePagina)
				if (res.ok){
					const json = await res.json();
					natalitystats = json;
					Aux=num;
				}
			}
		}else{
			numeroDePagina = numeroDePagina+limit;
			const res = await fetch("/api/v2/natality-stats?country="+searchCountry+"&year="+searchYear+"&natality_totalsMax="+
                    natality_totalsMax+"&natality_totalsMin="+natality_totalsMin+"&natality_menMin="+natality_menMin+
                    "&natality_menMax="+
                    natality_menMax+ +"&natality_womenMin="+natality_womenMin + "&natality_womenMax="+
                    natality_womenMax+"&limit="+limit+"&offset="+numeroDePagina)
			if (res.ok){
					const json = await res.json();
					natalitystats = json;
					Aux=num;
			}
		}
	}
	async function getStatsNat(){
		console.log("Fetching stats...");
		const res = await fetch("/api/v2/natality-stats");
		if(res.ok){
			console.log("Ok:");
			const json = await res.json();
			natalitystats = json;
			console.log("Received "+natalitystats.length+" stats.");
		}else{
			window.alert("No se encuentra ningún dato.");
			errorMsg =" El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText;
			console.log("ERROR!");
		}
	}
	async function loadInitialData(){
		console.log("Loading stats...");
		const res = await fetch("/api/v2/natality-stats/loadInitialData",{
			method: "GET"
		}).then(function(res){
			if(res.ok){
				getStatsNat();
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
		console.log("Inserting stat...");
		if (newStat.country == "" || newStat.country == null || newStat.year == "" || newStat.year == null) {
			window.alert("Pon un país y un año");
		}else{
			const res = await fetch("/api/v2/natality-stats",{
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
				}else if(res.status==400){
					window.alert("Campo mal escrito.No puede insertarlo.");
				}else{
					window.alert("Dato ya creado. No puede insertarlo.");
				}
				errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText;
				console.log("ERROR!");
			});
		}
	}
	async function deleteStat(country,year){
		console.log("Deleting stat...");
		const res = await fetch("/api/v2/natality-stats/"+country+"/"+year,{
			method: "DELETE"
		}).then(function (res){
			window.alert("Dato eliminado correctamente.");
			getStats();
		});
	}
	async function deleteStats(){
		console.log("Deleting stat...");
		const res = await fetch("/api/v2/natality-stats",{
			method: "DELETE"
		}).then(function (res){
			window.alert("Base de datos eliminada correctamente.");			
			getStatsNat();
			location.reload();
		});
	}
</script>

<main>
	<h3>Vista completa de elementos. </h3>
	{#await natalitystats}
		Loading natalitystats...
	{:then natalitystats}
		<Table bordered>
			<thead>
				<tr>
					<th>País</th>
					<th>Año</th>
					<th>Natalidad Total</th>
					<th>Natalidad Hombres</th>
					<th>Natalidad Mujeres</th>
					<th>Acciones</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><input type = "text" bind:value = "{newStat.country}"></td>
					<td><input type = "number" bind:value = "{newStat.year}"></td>
					<td><input type = "number" bind:value = "{newStat.natality_totals}"></td>
					<td><input type = "number" bind:value = "{newStat.natality_men}"></td>
					<td><input type = "number" bind:value = "{newStat.natality_women}"></td>
					<td><Button outline color="primary" on:click={insertStat}>Insertar</Button></td>
				</tr>
				{#each natalitystats as stat}
					<tr>
						<td>
							<a href="#/natality-stats/{stat.country}/{stat.year}">{stat.country}</a>
						</td>
						<td>{stat.year}</td>
						<td>{stat.natality_totals}</td>
						<td>{stat.natality_men}</td>
						<td>{stat.natality_women}</td>
						<td><Button outline color="danger" on:click="{deleteStat(stat.country,stat.year)}">Eliminar</Button></td>
					</tr>
				{/each}
			</tbody>
		</Table>
	{/await}
	{#if errorMsg}
        <p style="color: red">ERROR: {errorMsg}</p>
    {/if}
	<Button outline color="secondary" on:click="{loadInitialData}">Cargar datos iniciales</Button>
	<Button outline color="danger" on:click="{deleteStats}">Borrar todo</Button>
	{#if numeroDePagina==0}
        <Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, 
            natality_totalsMin, natality_totalsMax, natality_menMin, natality_menMax, natality_womenMin,
            natality_womenMax, 2)}">&gt</Button>
	{/if}
	{#if numeroDePagina>0}
		<Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, 
            natality_totalsMin, natality_totalsMax, natality_menMin, natality_menMax, natality_womenMin,
            natality_womenMax, 1)}">Pagina anterior</Button>
		<Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, 
            natality_totalsMin, natality_totalsMax, natality_menMax, natality_menMax, natality_womenMin, 
            natality_womenMax, 2)}">Pagina siguiente</Button>
	{/if}
	<h6>Para verlo mediante páginas pulse el botón de avanzar página. </h6>
	<tr>
		<td><label>País: <input bind:value="{searchCountry}"></label></td>
		<td><label>Mínimo número de natalidad total: <input bind:value="{natality_totalsMin}"></label></td>
		<td><label>Mínimo número de natalidad en hombres: <input bind:value="{natality_menMin}"></label></td>
		<td><label>Mínimo número de natalidad en mujeres: <input bind:value="{natality_womenMin}"></label></td>
	</tr>
	<tr>
		<td><label>Año: <input bind:value="{searchYear}"></label></td>
		<td><label>Máximo número de natalidad total: <input bind:value="{natality_totalsMax}"></label></td>
		<td><label>Máximo número de natalidad en hombres: <input bind:value="{natality_menMax}"></label></td>
		<td><label>Máximo número de natalidad en mujeres: <input bind:value="{natality_womenMax}"></label></td>
	</tr>

    <Button outline color="primary" on:click="{busqueda (searchCountry, searchYear, natality_totalsMin, natality_totalsMax, 
        natality_menMin, natality_menMax, natality_womenMin, natality_womenMax)}">Buscar</Button>
	<h6>Si quiere ver todos los datos después de una búsqueda, quite todo los filtros y pulse el botón de buscar. </h6>
</main>

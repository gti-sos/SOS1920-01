<script>
	import {
		onMount
	} from "svelte";
	import Table from "sveltestrap/src/Table.svelte";
	import Button from "sveltestrap/src/Button.svelte";
	let emistats = [];
	let newEmiStat = {
		country : "",
		year : "",
		em_man: "",
		em_woman: "",
		em_totals: ""
    };
    
    let numeroDePagina = 0;
	let numeroAux;
	let limit = 10;
	let searchCountry = "";
	let searchYear = "";
	let em_manMin = "";
	let em_manMax = "";
	let em_womanMin = "";
	let em_womanMax = "";
	let em_totalsMin = "";
	let em_totalsMax = "";
	let errorMsg = "";
	let exitoMsg = "";
    
    onMount(getEmiStats);
	async function getEmiStats(){
		console.log("Fetching stats....");
		const res = await fetch("/api/v2/emigrants-stats?offset="+numeroDePagina+"&limit="+limit);
		if(res.ok){
			console.log("Ok:");
			const json = await res.json();
			emistats = json;
			console.log("Received "+emistats.length+" stats.");
		}else{
			console.log("ERROR");
		};
    };
///////////////////////////////////// BUSQUEDA ////////////////////////////////////////////
    async function busqueda(searchCountry, searchYear, em_manMin, em_manMax, em_womanMin, em_womanMax, em_totalsMin, em_totalsMax){
		exitoMsg = "";
		errorMsg = "";
		if(typeof searchCountry=='undefined'){searchCountry="";}
		if(typeof searchYear=='undefined'){searchYear="";}
		if(typeof em_manMin=='undefined'){em_manMin="";}
		if(typeof em_manMax=='undefined'){em_manMax="";}
		if(typeof em_womanMin=='undefined'){em_womanMin="";}
		if(typeof em_womanMax=='undefined'){em_womanMax="";}
		if(typeof em_totalsMin=='undefined'){em_totalsMin="";}
        if(typeof em_totalsMax=='undefined'){em_totalsMax="";}

        const res = await fetch("/api/v2/emigrants-stats?country="+searchCountry+"&year="+searchYear+
        "&em_manMin="+em_manMin+
        "&em_manMax="+em_manMax+
        "&em_womanMin="+em_womanMin+
        "&em_womanMax="+em_womanMax+
        "&em_totalsMin="+em_totalsMin+
        "&em_totalsMax="+em_totalsMax)
        
		if (res.ok){
			const json = await res.json();
			emistats = json;
			console.log("Found "+ emistats.length + " emistats");
			window.alert("Se han encontrado datos.");
			exitoMsg = "Código de mensaje: "+ res.status + ": " +res.statusText + ", Datos encontrados";
		}else if(res.status==404){
			//window.alert("No se encuentran datos.");
			errorMsg = "Código de error: " + res.status + "-"+ res.statusText+ ", dato no encontrado";	
		}else{console.log("ERROR:"+" El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText);};
    }
    
/////////////////////// Paginación ////////////////////////////////////

async function paginacion(searchCountry, searchYear, em_manMin, em_manMax, em_womanMin, em_womanMax, em_totalsMin, em_totalsMax,num){
		numeroAux=num;
		if(typeof searchCountry=='undefined'){searchCountry="";}
        if(typeof searchYear=='undefined'){searchYear="";}
        if(typeof em_manMin=='undefined'){em_manMin="";}
		if(typeof em_manMax=='undefined'){em_manMax="";}
		if(typeof em_womanMin=='undefined'){em_womanMin="";}
		if(typeof em_womanMax=='undefined'){em_womanMax="";}
		if(typeof em_totalsMin=='undefined'){em_totalsMin="";}
		if(typeof em_totalsMax=='undefined'){em_totalsMax="";}
		if(num==1){
			numeroDePagina=numeroDePagina-limit;
			if(numeroDePagina<0){
				numeroDePagina=0;
                const res = await fetch("/api/v2/emigrants-stats?country="+searchCountry+
                "&year="+searchYear+
                "&em_manMin="+em_manMin+
                "&em_manMax="+em_manMax+
                "&em_womanMin="+em_womanMin+
                "&em_womanMax="+em_womanMax+
                "&em_totalsMin="+em_totalsMin+
                "&em_totalsMax="+em_totalsMax+
                "&limit="+limit+
                "&offset="+numeroDePagina)
				if (res.ok){
					const json = await res.json();
					emistats = json;
					numeroAux=num;}
			}else{
                const res = await fetch("/api/v2/emigrants-stats?country="+searchCountry+
                "&year="+searchYear+
                "&em_manMin="+em_manMin+
                "&em_manMax="+em_manMax+
                "&em_womanMin="+em_womanMin+
                "&em_womanMax="+em_womanMax+
                "&em_totalsMin="+em_totalsMin+
                "&em_totalsMax="+em_totalsMax+
                "&limit="+limit+
                "&offset="+numeroDePagina)
				if (res.ok){
					const json = await res.json();
					emistats = json;
					numeroAux=num;
				}
			}
		}else{
			numeroDePagina = numeroDePagina+limit;
            const res = await fetch("/api/v2/emigrants-stats?country="+searchCountry+
            "&year="+searchYear+
            "&em_manMin="+em_manMin+
            "&em_manMax="+em_manMax+
            "&em_womanMin="+em_womanMin+
            "&em_womanMax="+em_womanMax+
            "&em_totalsMin="+em_totalsMin+
            "&em_totalsMax="+em_totalsMax+
            "&limit="+limit+
            "&offset="+numeroDePagina)
			if (res.ok){
					const json = await res.json();
					emistats = json;
					numeroAux=num;
			}
		}
    }
    async function getStats(){
		exitoMsg = "";
		errorMsg = "";
		console.log("Fetching stats...");
		const res = await fetch("/api/v2/emigrants-stats");
		if(res.ok){
			console.log("Ok:");
			const json = await res.json();
			emistats = json;
			console.log("Received "+emistats.length+" stats.");
		}else{
			window.alert("No se encuentra ningún dato.");
			//errorMsg = "Código de error: " + res.status + "-"+ res.statusText+ ", no se ha encontrado el dato";
		}
	}
	async function loadInitialData(){
		exitoMsg = "";
		errorMsg = "";
		console.log("Loading stats...");
		const res = await fetch("/api/v2/emigrants-stats/loadInitialData",{
			method: "GET"
		}).then(function(res){
			if(res.ok){
				getStats();
				window.alert("Datos iniciales cargados.");
				exitoMsg = "Código de mensaje: "+ res.status + ": " +res.statusText + ", Datos generados correctamente";
			}else if(res.status==400){
				window.alert("La base de datos no está vacía. Debe vaciarla para cargar los datos iniciales");
				errorMsg = "Código de error: " + res.status + "-"+ res.statusText+ ", La base de datos debe estar vacía";
			}else{
				errorMsg = "Código de error: " + res.status + "-"+ res.statusText+ ", no se puede generar datos correctamente";
			}	
		});
	}
	async function insertEmiStat(){
		exitoMsg = "";
		errorMsg = "";
		console.log("Inserting stat...");
		if (newEmiStat.country == "" || newEmiStat.country == null || newEmiStat.year == "" || newEmiStat.year == null) {
			window.alert("Falta país y un año");
		}else{
			const res = await fetch("/api/v2/emigrants-stats",{
				method: "POST",
				body: JSON.stringify(newEmiStat),
				headers:{
					"Content-Type": "application/json"
				}
			}).then(function (res){
				if(res.ok){
					console.log("Ok:");
					getStats();
					//window.alert("Dato insertado correctamente.");
					exitoMsg = "Código de mensaje: " + res.status + ": " +res.statusText + ", Dato insertado correctamente";
				}else if(res.status==400){
					window.alert("Campo mal escrito. No puede insertarlo.");
					errorMsg = "Código de error: " + res.status + "-"+ res.statusText+ ", rellene todos los campos correctamente";	
				}else{
					window.alert("Dato ya creado. No puede insertarlo.");
					errorMsg = "Código de error: " + res.status + "-"+ res.statusText+ ", el dato ya existe";	
				}
				
			});
		}
    }
    async function deleteEmiStat(country,year){
		exitoMsg = "";
		errorMsg = "";
		console.log("Deleting stat...");
		const res = await fetch("/api/v2/emigrants-stats/"+country+"/"+year,{
			method: "DELETE"
		}).then(function (res){
			getStats();
			exitoMsg = "Código de mensaje: " + res.status + "-"+ res.statusText+ ", Borrado correctamente";
		});
    }/*
    async function deleteEmi1Stat(country){
		console.log("Deleting stat...");
		const res = await fetch("/api/v2/emigrants-stats/"+country,{
			method: "DELETE"
		}).then(function (res){
			window.alert("Dato eliminado correctamente.");
			getStats();
		});
	}*/
	async function deleteEmiStats(){
		exitoMsg = "";
		errorMsg = "";
		console.log("Deleting stat...");
		const res = await fetch("/api/v2/emigrants-stats",{
			method: "DELETE"
		}).then(function (res){
			window.alert("Base de datos eliminada correctamente.");	
			getStats();
			location.reload();
			exitoMsg = "Código de mensaje: " + res.status + "-"+ res.statusText+ ", Borrados correctamente";
		});
	}
</script>

<main>
	<h3>Datos sobre emigrantes. 🛫 </h3>
	{#await emistats}
		Loading emistats...
	{:then emistats}
		<Table bordered>
			<thead>
				<tr>
					<th>País</th>
					<th>Año</th>
					<th>Emigrantes (Hombres)</th>
					<th>Emigrantes (Mujeres)</th>
					<th>Emigrantes (Totales)</th>
					<th>Acciones</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><input type = "text" bind:value = "{newEmiStat.country}"></td>
					<td><input type = "number" bind:value = "{newEmiStat.year}"></td>
					<td><input type = "number" bind:value = "{newEmiStat.em_man}"></td>
					<td><input type = "number" bind:value = "{newEmiStat.em_woman}"></td>
					<td><input type = "number" bind:value = "{newEmiStat.em_totals}"></td>
					<td><Button outline color="primary" on:click={insertEmiStat}>Insertar</Button></td>
				</tr>
				{#each emistats as emistat}
					<tr>
						<td><a href="#/emigrants-stats/{emistat.country}/{emistat.year}">{emistat.country}</a></td>
						<td>{emistat.year}</td>
						<td>{emistat.em_man}</td>
						<td>{emistat.em_woman}</td>
						<td>{emistat.em_totals}</td>
						<td><Button outline color="danger" on:click="{deleteEmiStat(emistat.country,emistat.year)}">Eliminar</Button></td>
					</tr>
				{/each}
			</tbody>
		</Table>
	{/await}
	{#if errorMsg}<p style="color: red">ERROR: {errorMsg}</p>{/if}
	{#if exitoMsg} <p style="color: green">ÉXITO: {exitoMsg}</p> {/if}
	<Button outline color="secondary" on:click="{loadInitialData}">Cargar datos iniciales</Button>
	<Button outline color="danger" on:click="{deleteEmiStats}">Borrar todo</Button>
	{#if numeroDePagina==0}
		<Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, em_manMin, em_manMax, em_womanMin, em_womanMax, em_totalsMin, em_totalsMax, 2)}">Pagina siguiente</Button>
	{/if}
	{#if numeroDePagina>0}
		<Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, em_manMin, em_manMax, em_womanMin, em_womanMax, em_totalsMin, em_totalsMax, 1)}">Pagina anterior</Button>
		<Button outline color="primary" on:click="{paginacion(searchCountry, searchYear, em_manMin, em_manMax, em_womanMin, em_womanMax, em_totalsMin, em_totalsMax, 2)}">Pagina siguiente</Button>
	{/if}
	<h6>Para verlo mediante páginas pulse el botón de avanzar página. </h6>
	<tr>
		<td><label>País: <input bind:value="{searchCountry}"></label></td>
		<td><label>Mínimo de emigrantes (Hombres): <input bind:value="{em_manMin}"></label></td>
		<td><label>Mínimo de emigrantes (Mujeres): <input bind:value="{em_womanMin}"></label></td>
		<td><label>Mínimo de emigrantes (Totales): <input bind:value="{em_totalsMin}"></label></td>
	</tr>
	<tr>
		<td><label>Año: <input bind:value="{searchYear}"></label></td>
		<td><label>Máximo de emigrantes (Hombres): <input bind:value="{em_manMax}"></label></td>
		<td><label>Máximo de emigrantes (Mujeres): <input bind:value="{em_womanMax}"></label></td>
		<td><label>Máximo de emigrantes (Totales): <input bind:value="{em_totalsMax}"></label></td>
	</tr>

	<Button outline color="primary" on:click="{busqueda (searchCountry, searchYear, em_manMin, em_manMax, em_womanMin, em_womanMax, em_totalsMin, em_totalsMax)}">Buscar</Button>
	<h6>Si quiere ver todos los datos después de una búsqueda, quite todo los filtros y pulse el botón de buscar. </h6>
</main>

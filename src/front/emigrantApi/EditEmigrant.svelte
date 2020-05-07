<script>
    import {onMount} from "svelte";
    import {pop} from "svelte-spa-router";
    import Table from "sveltestrap/src/Table.svelte";
	import Button from "sveltestrap/src/Button.svelte";
    export let params = {};
    let eStat  = {};
    let updatedCountry = "";
    let updatedYear = "";
    let updatedEm_man = 0.0;
    let updatedEm_woman = 0.0;
    let updatedEm_totals = 0.0;
	let errorMsg = "";
	let exitoMsg = "";
    onMount(getStat);
	async function getStat(){
		console.log("Fetching stat...");
		const res = await fetch("/api/v2/emigrants-stats/"+params.country+"/"+params.year);
		if(res.ok){
			console.log("Ok:");
			const json = await res.json();
            eStat = json;
            updatedCountry = eStat.country;
            updatedYear = eStat.year;
            updatedEm_man = eStat.em_man;
            updatedEm_woman = eStat.em_woman;
            updatedEm_totals = eStat.em_totals;
            
			console.log("Received stats.");
		}else{
            errorMsg = " El tipo de error es: " + res.status + res.statusText + " , rellene los campos correctamente " ;
		}
	}
    async function updateStat(){
        console.log("Updating stat..."+JSON.stringify(params.country));
		const res = await fetch("/api/v2/emigrants-stats/"+params.country+"/"+params.year,{
			method: "PUT",
			body: JSON.stringify({
                country : params.country,
                year : parseInt(params.year),
                "em_man" : updatedEm_man,
                "em_woman" : updatedEm_woman,
                "em_totals" : updatedEm_totals
            }),
			headers:{
				"Content-Type": "application/json"
			}
		}).then(function (res){
			getStat();
			if(res.ok){
				exitoMsg = res.status + ": " + res.statusText + ". Dato actualizado con éxito"; 
				getStat();
				window.alert("Dato modificado correctamente.");
			}else if(res.status==400){
				window.alert("Campo mal escrito. No puede editarlo.");
			}else{
				errorMsg = " El tipo de error es: " + res.status + res.statusText + ", rellene todos los campos correctamente" ;
			};			
		});
	};
</script>
<main>
    <h3>Editando elemento <strong>{params.country} {params.year}</strong> </h3>
    {#await eStat}
		Loading eStat...
	{:then eStat}
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
					<td>{updatedCountry}</td>
					<td>{updatedYear}</td>
					<td><input type = "number" bind:value = "{updatedEm_man}"></td>
					<td><input type = "number" bind:value = "{updatedEm_woman}"></td>
					<td><input type = "number" bind:value = "{updatedEm_totals}"></td>
					<td><Button outline color="primary" on:click={updateStat}>Actualizar</Button></td>
				</tr>
			</tbody>
		</Table>
    {/await}
    {#if errorMsg}<p style="color: red">ERROR: {errorMsg}</p>{/if}
	{#if exitoMsg} <p style="color: green">{exitoMsg}</p> {/if}
    <Button outline color="secondary" on:click="{pop}">Volver</Button>
</main>
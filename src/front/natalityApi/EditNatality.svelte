<script>
	import {
        onMount
    } from "svelte";
	import {
        pop
    } from "svelte-spa-router";
	import Table from "sveltestrap/src/Table.svelte";
	import Button from "sveltestrap/src/Button.svelte";
	
	export let params = {};
	let stats= {};    
	let updatedCountry = "";
	let updatedYear = 0;
	let updatedNatalityTotals = 0.0;
	let updatedNatalityMen = 0.0;
	let updatedNatalityWomen= 0.0;
	let errorMsg = "";
	let exitoMsg = "";

	
	onMount(getStats);
	
		async function getStats() {
			console.log("Fetching natality-stats ...");
			const res = await fetch("/api/v2/natality-stats/"+ params.country + "/" + params.year);
			if (res.ok) {
				console.log("Ok:");
				const json = await res.json();
				stats = json;
				updatedCountry = params.country;
				updatedYear = params.year;
				updatedNatalityTotals = stats.natality_totals;
				updatedNatalityMen = stats.natality_men;
				updatedNatalityWomen = stats.natality_women;
				console.log("Data loaded");
			} else {
				errorMsg = "El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText;
				console.log("¡ERROR!");
			}
		}
	
		async function updateStats(){
			exitoMsg ="";
			errorMsg ="";
			console.log("Updating natality ...");
			const res = await fetch("/api/v2/natality-stats/" + params.country + "/" + params.year, {
				method: "PUT",
				body: JSON.stringify({
					country: params.country,
					year: parseInt(params.year),
					"natality_totals": updatedNatalityTotals,
					"natality_men": updatedNatalityMen,
					"natality_women": updatedNatalityWomen
				}),
				headers: {
					"Content-Type": "application/json"
				}
			}).then(function (res) {
				getStats();
				if(res.ok){
					exitoMsg = res.status + ": " + res.statusText + ". El Dato ha sido actualizado con éxito";
					console.log("OK!" + exitoMsg);
					getStats();
					window.alert("Dato ha sido modificado correctamente.");
				}else if(res.status == 400){
                    window.alert("Los datos que se insertan no son válidos");
				}else{
				errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText;
				console.log("ERROR!");
				};			
			});
		};
	
	</script>
	<main>
		<h3>Editar el dato: <strong>{params.country} {params.year}</strong></h3>
    {#await stats}
        Loading data ...
    {:then stats}
        <Table bordered>
            <thead>
                <tr>
                  	<th>País</th>
                	<th>Año</th>
                	<th>Natalidad Total</th>
                	<th>Natalidad en Hombres</th>
					<th>Natalidad en Mujeres</th>
					<th>Acción</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{updatedCountry}</td>
					<td>{updatedYear}</td>
                    <td><input type="number" bind:value="{updatedNatalityTotals}"></td>
                    <td><input type="number" bind:value="{updatedNatalityMen}"></td>
					<td><input type="number" bind:value="{updatedNatalityWomen}"></td>
                    <td> <Button outline  color="success" on:click={updateStats}>Actualizar</Button></td>
                </tr>
        </tbody>
        </Table>
	{/await}
	{#if errorMsg}
        <p style="color: red">{errorMsg}</p>
    {/if}
    {#if exitoMsg}
        <p style="color: green">{exitoMsg}</p>
    {/if}
    <Button outline color="secondary" on:click="{pop}">Volver</Button>
	</main>
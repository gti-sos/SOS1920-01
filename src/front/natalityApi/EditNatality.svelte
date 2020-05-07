<script>
	import {
        onMount
    } from "svelte";
	import {
        pop
    } from "svelte-spa-router";
	import Table from "sveltestrap/src/Table.svelte";
	import Button from "sveltestrap/src/Button.svelte";
	import Input from "sveltestrap/src/Input.svelte";
	
	export let params = {};
	let natality= {};    
	let updatedCountry = "";
	let updatedYear = 0;
	let updatedNatalityTotals = 0.0;
	let updatedNatalityMen = 0.0;
	let updatedNatalityWomen= 0.0;
	let exitoMens = "";

	
	onMount(getNatalitystats);
	
		async function getNatalitystats() {
			console.log("Fetching natality-stats ...");
			const res = await fetch("/api/v2/natality-stats/"+ params.country + "/" + params.year);
			if (res.ok) {
				console.log("Ok:");
				const json = await res.json();
				natality = json;
				updatedCountry = params.country;
				updatedYear = parseInt(params.year);
				updatedNatalityTotals = natality.natalityTotals;
				updatedNatalityMen = natality.natalityMen;
				updatedNatalityWomen = natality.natalityWomen;
				console.log("Data loaded");
			} else if(res.status == 404){
				window.alert("El dato " + natality.country + " " + params.year + " no existe");
			}
		}
	
		async function updateNatality(){
			console.log("Updating natality ...");
			const res = await fetch("/api/v2/natality-stats/" + params.country + "/" + params.year, {
				method: "PUT",
				body: JSON.stringify({
					country: params.country,
					year: parseInt(params.year),
					"Natality Totals": updatedNatalityTotals,
					"Natality Men": updatedNatalityMen,
					"Natality Women": updatedNatalityWomen
				}),
				headers: {
					"Content-Type": "application/json"
				}
			}).then(function (res) {
				getNatalitystats();
				if(res.ok){
                    exitoMens = res.status + ": " + res.statusText + ". El Dato ha sido actualizado con éxito";
				}else if(res.status == 400){
                    window.alert("Los datos que se insertan no son válidos");
				}
			});
		}
	
	</script>
	<main>
		<h3>Editar el dato: <strong>{params.country} {params.year}</strong></h3>
    {#await natality}
        Loading data ...
    {:then natality}
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
                    <td> <Button outline  color="success" on:click={updateNatality}>Actualizar</Button></td>
                </tr>
        </tbody>
        </Table>
    {/await}
    {#if exitoMens}
        <p style="color: green">{exitoMens}</p>
    {/if}
    <Button outline color="secondary" on:click="{pop}">Volver</Button>
	</main>
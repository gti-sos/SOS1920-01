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
    let stat  = {};
    let updatedCountry = "";
    let updatedYear = "";
    let updatedPoverty_prp = "";
    let updatedPoverty_pt = "";
    let updatedPoverty_ht = "";
    let errorMsg = "";
    onMount(getStat);
	async function getStat(){
		console.log("Fetching stat...");
		const res = await fetch("/api/v2/poverty-stats/"+params.country+"/"+params.year);
		if(res.ok){
			console.log("Ok:");
			const json = await res.json();
            stat = json;
            updatedCountry = stat.country;
            updatedYear = stat.year;
            updatedPoverty_prp = stat.poverty_prp;
            updatedPoverty_pt = stat.poverty_pt;
            updatedPoverty_ht = stat.poverty_ht;
            
			console.log("Received stats.");
		}else{
            errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText;
			console.log("ERROR!");
		}
	}
    async function updateStat(){
        console.log("Updating stat..."+JSON.stringify(params.country));
		const res = await fetch("/api/v2/poverty-stats/"+params.country+"/"+params.year,{
			method: "PUT",
			body: JSON.stringify({
                country : params.country,
                year : Number(params.year),
                poverty_prp : Number(updatedPoverty_prp),
                poverty_pt : Number(updatedPoverty_pt),
                poverty_ht : Number(updatedPoverty_ht)
            }),
			headers:{
				"Content-Type": "application/json"
			}
		}).then(function (res){
			if(res.ok){
				getStat();
				window.alert("Dato modificado correctamente.");
			}else if(res.status==400){
				window.alert("Campo mal escrito.No puede editarlo.");
			}else{
				errorMsg = " El tipo de error es: " + res.status + ", y quiere decir: " + res.statusText;
				console.log("ERROR!");
			};			
		});
	};
</script>
<main>
    <h3>Editando elemento <strong>{params.country}{params.year}</strong> </h3>
    {#await stat}
		Loading stat...
	{:then stat}
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
					<td>{updatedCountry}</td>
					<td>{updatedYear}</td>
					<td><input type = "number" bind:value = "{updatedPoverty_prp}"></td>
					<td><input type = "number" bind:value = "{updatedPoverty_pt}"></td>
					<td><input type = "number" bind:value = "{updatedPoverty_ht}"></td>
					<td><Button outline color="primary" on:click={updateStat}>Actualizar</Button></td>
				</tr>
			</tbody>
		</Table>
    {/await}
    {#if errorMsg}
        <p style="color: red">ERROR: {errorMsg}</p>
    {/if}
    <Button outline color="secondary" on:click="{pop}">Volver</Button>
</main>
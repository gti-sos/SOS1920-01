<script>
	import {pop} from "svelte-spa-router";
    import Button from "sveltestrap/src/Button.svelte";
	async function loadGraph(){

	let MyData = [];
	let API_22 = [];
		
	const resData = await fetch("/api/v2/poverty-stats");
	MyData = await resData.json();
    
    const resData2 = await fetch("/api/v1/swim-stats");
		if (resData2.ok) {
			console.log("Ok, api 22 loaded");
			const json = await resData2.json();
            API_22 = json;
			console.log(API_22)
		} else {
			console.log("ERROR!");
        }
		let aux = []
		let valores = []
		MyData.forEach((x) => {
            API_22.forEach((y) => {
        	if(x.year==2010 && ((x.country=="france" && y.country=="france")||(x.country=="italy" && y.country=="italy")||(x.country=="unitedKingdom" && y.country=="united kingdom"))){	
				aux={
					name: y.country,
					data: [parseInt(y.yearofbirth),parseInt(y.position),parseInt(x.poverty_pt),parseInt(x.poverty_ht)]
				}
				valores.push(aux)
            }
        });
        });
		

		Highcharts.chart('container', {
			chart: {
				type: 'bar'
			},
			title: {
				text: 'Natación y riesgo de pobreza en Italia, Francia y Reino Unido'
			},
			xAxis: {
				categories: ['Años Nacimiento', 'Posición', 'Umbral de persona', 'Umbral de hogar'],
				title: {
					text: null
				}
			},
			yAxis: {
				min: 0,
				labels: {
					overflow: 'justify'
				}
			},
			plotOptions: {
				bar: {
					dataLabels: {
						enabled: true
					}
				}
			},
			credits: {
				enabled: false
			},
			series: valores
		});
	}
</script>
	<svelte:head>
		<script src="https://code.highcharts.com/highcharts.js"></script>
		<script src="https://code.highcharts.com/modules/exporting.js"></script>
		<script src="https://code.highcharts.com/modules/export-data.js"></script>
		<script src="https://code.highcharts.com/modules/accessibility.js" on:load="{loadGraph}"></script>
	</svelte:head>
<main>
	<h3 style="text-align: center;"> Integración con Natación del grupo 22</h3>
	<Button outline color="secondary" on:click="{pop}">Atrás</Button>
	<figure class="highcharts-figure">
		<div id="container"></div>
		<p style="text-align:center;" class="highcharts-description">
			Natación y riesgo de pobreza en Italia, Francia y Reino Unido.
		</p>
	</figure>

</main>

<style>
	.highcharts-figure, .highcharts-data-table table {
		min-width: 310px; 
		max-width: 800px;
		margin: 1em auto;
	}

	#container {
		height: 400px;
	}

	.highcharts-data-table table {
		font-family: Verdana, sans-serif;
		border-collapse: collapse;
		border: 1px solid #EBEBEB;
		margin: 10px auto;
		text-align: center;
		width: 100%;
		max-width: 500px;
	}
	.highcharts-data-table caption {
		padding: 1em 0;
		font-size: 1.2em;
		color: #555;
	}
	.highcharts-data-table th {
		font-weight: 600;
		padding: 0.5em;
	}
	.highcharts-data-table td, .highcharts-data-table th, .highcharts-data-table caption {
		padding: 0.5em;
	}
	.highcharts-data-table thead tr, .highcharts-data-table tr:nth-child(even) {
		background: #f8f8f8;
	}
	.highcharts-data-table tr:hover {
		background: #f1f7ff;
	}

</style>
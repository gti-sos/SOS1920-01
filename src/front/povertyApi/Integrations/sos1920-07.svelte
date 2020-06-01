<script>
	import {pop} from "svelte-spa-router";
    import Button from "sveltestrap/src/Button.svelte";
	async function loadGraph(){

	let MyData = [];
	let API_07 = [];
		
	const resData = await fetch("/api/v2/poverty-stats");
	MyData = await resData.json();
    
    const resData2 = await fetch("https://sos1920-07.herokuapp.com/api/v2/imports");
		if (resData2.ok) {
			console.log("Ok, api 07 loaded");
			const json = await resData2.json();
            API_07 = json;
			console.log(API_07)
		} else {
			console.log("ERROR!");
        }
		let aux = []
		let valores = []
		MyData.forEach((x) => {
        	if(x.year==2010 && (x.country=="spain"||x.country=="germany")){	
				aux={
					name: x.country,
					data: [0,0,parseInt(x.poverty_pt), parseInt(x.poverty_ht)]
				}
				valores.push(aux)
			}
        });
		API_07.forEach((x) => {
            if(x.year==2010 && (x.country=="south-korea"||x.country=="china")){	
				aux={
					name: x.country,
					data: [parseInt(x.gdawaste),parseInt(x.gdaethylalcohol),0,0]
				}
				valores.push(aux)
			}  	
		

        });

		Highcharts.chart('container', {
			chart: {
				type: 'bar'
			},
			title: {
				text: 'Importaciones y riesgo de pobreza en el año 2010'
			},
			xAxis: {
				categories: ['Residuos', 'Alcohol', 'Umbral de persona', 'Umbral de hogar'],
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
	<h3 style="text-align: center;"> Integración con la API Importaciones del grupo 07</h3>
	<Button outline color="secondary" on:click="{pop}">Atrás</Button>
	<figure class="highcharts-figure">
		<div id="container"></div>
		<p style="text-align:center;" class="highcharts-description">
			Importaciones y riesgo de pobreza en el año 2010.
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
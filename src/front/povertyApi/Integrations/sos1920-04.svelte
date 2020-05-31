<script>
	import {pop} from "svelte-spa-router";
    import Button from "sveltestrap/src/Button.svelte";
	async function loadGraph(){

	let MyData = [];
	let API_04 = [];
		
	const resData = await fetch("/api/v2/poverty-stats");
	MyData = await resData.json();
    
    const resData2 = await fetch("https://sos1920-04.herokuapp.com/api/v2");
		if (resData2.ok) {
			console.log("Ok, api 04 loaded");
			const json = await resData2.json();
            API_04 = json;
			console.log(API_04)
		} else {
			console.log("ERROR!");
        }
		let aux = []
		let valores = []
		MyData.forEach((x) => {
        	if(x.year==2017 && (x.country=="spain"||x.country=="germany")){	
				aux={
					name: x.country,
					data: [0,0,parseInt(x.poverty_pt), parseInt(x.poverty_ht)]
				}
				valores.push(aux)
			}
        });
		API_04.forEach((x) => {
            if(x.year==2017 && (x.country=="Spain"||x.country=="Germany")){	
				aux={
					name: x.country,
					data: [parseInt(x.oil-consumption),parseInt(x.coal-consumption),0,0]
				}
				valores.push(aux)
			}  	
		

        });

		Highcharts.chart('container', {
			chart: {
				type: 'bar'
			},
			title: {
				text: 'Enegías primaria y riesgo de pobreza en el año 2017'
			},
			xAxis: {
				categories: ['Consumo de Gasolina', 'Consumo de Carbón', 'Umbral de persona', 'Umbral de hogar'],
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
	<h3 style="text-align: center;"> Integración con la API Enegías primarias del grupo 04</h3>
	<Button outline color="secondary" on:click="{pop}">Volver</Button>
	<figure class="highcharts-figure">
		<div id="container"></div>
		<p style="text-align:center;" class="highcharts-description">
			Enegías primaria y riesgo de pobreza en el año 2017.
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
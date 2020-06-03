<script>
	import {pop} from "svelte-spa-router";
    import Button from "sveltestrap/src/Button.svelte";
	async function loadGraph(){

	let MyData = [];
	let API_28 = [];
		
	const resData = await fetch("/api/v2/natality-stats");
	MyData = await resData.json();
    
    const resData2 = await fetch("/api/v1/gce");
		if (resData2.ok) {
			console.log("Ok, api 28 loaded");
			const json = await resData2.json();
            API_28 = json;
			console.log(API_28)
		} else {
			console.log("ERROR!");
        }
		let aux = []
		let valores = []
		MyData.forEach((x) => {
        	if(x.year==2017 && (x.country=="spain"||x.country=="germany")){	
				aux={
					name: x.country +" " +x.year,
					data: [0,0,parseInt(x.natality_men), parseInt(x.natality_women)]
				}
				valores.push(aux)
			}
        });
		API_28.forEach((x) => {
            if(x.year==2014 && (x.country=="Spain" || x.country=="Germany")){	
				aux={
					name: x.country +" " +x.year,
					data: [parseInt(x.gce_country),parseInt(x.gce_cars),0,0]
				}
				valores.push(aux)
			}  
		

		});
		
		Highcharts.chart('container', {
			chart: {
				type: 'column'
			},
			title: {
				text: 'Natalidad y GCE'
			},
			xAxis: {
				categories: ["Medias Países por producción", "Media de producción Coches", "Natalidad Hombres", "Natalidad Mujeres"]
			},
			yAxis: {
				min: 0,
				title: {
					text: 'Numero'
				}
			},
			tooltip: {
				headerFormat: '<b>{point.x}</b><br/>',
				pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
			},
			plotOptions: {
				column: {
					stacking: 'normal',
					dataLabels: {
						enabled: true
					}
				}
			},
			series: valores
		});
	};
</script>


<svelte:head>
	<script src="https://code.highcharts.com/highcharts.js"></script>
	<script src="https://code.highcharts.com/modules/exporting.js"></script>
	<script src="https://code.highcharts.com/modules/export-data.js"></script>
    <script src="https://code.highcharts.com/modules/accessibility.js" on:load="{loadGraph}"></script>
</svelte:head>
<figure class="highcharts-figure">
    <div id="container"></div>
    <p class="highcharts-description">
        En esta gráfica podemos ver la integracion con la API del G28.
	</p>
	<Button outline color="secondary" on:click="{pop}">Atrás</Button>
</figure>

<style>
	#container {
    height: 400px; 
}
.highcharts-figure, .highcharts-data-table table {
    min-width: 310px; 
    max-width: 800px;
    margin: 1em auto;
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
<script>
	import {pop} from "svelte-spa-router";
    import Button from "sveltestrap/src/Button.svelte";

	let MyData = [];
	let API_05 = [];
	
	async function loadGraph(){
		
		const resData = await fetch("/api/v2/natality-stats");
		MyData = await resData.json();
		const resData2 = await fetch("https://sos1920-05.herokuapp.com/api/v1/health_public");
		if (resData2.ok) {
			console.log("Ok, api 05 loaded");
			const json = await resData2.json();
            API_05 = json;
			console.log(API_05)
		} else {
			console.log("ERROR!");
        }
		let aux = []
		let valores = []
		MyData.forEach((x) => {
        	if(x.year==2017 && (x.country=="spain"||x.country=="italy")){	
				aux={
					name: x.country,
					data: [0,0,parseInt(x.natality_men)/1000,parseInt(x.natality_women)/1000]
				}//Dividemos el valor de los datos para que salga una mejor representación.
				valores.push(aux)
			}
        });
		API_05.forEach((x) => {
            if(x.year==2016 && (x.country=="italy"||x.country=="uk")){	
				aux={
					name: x.country,
					data: [x["public_spending"],x["public_spending_pib"],0,0]
				}//Datos pequeños y no se pueden mostrar todos a la vez
				valores.push(aux)
			}  	
		

        });

		Highcharts.chart('container', {
			chart: {
				type: 'column'
			},
			title: {
				text: 'Natalidad y Salud Pública'
			},
			xAxis: {
				categories: ["Gasto público", "Gasto público pib", "Natalidad Hombres", "Natalidad Mujeres"]
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
        En esta gráfica podemos ver la integracion con la API del G05.
        <br>
        <i>NOTA: Los valores de "Natalidad Hombres" y "Natalidad Mujeres" están dividos entre 1000 para una representación más visual.</i>
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
<script>
	import {pop} from "svelte-spa-router";
    import Button from "sveltestrap/src/Button.svelte";

	let MyData = [];
	let API_09 = [];
	
	async function loadGraph(){
		
		const resData = await fetch("/api/v2/natality-stats");
		MyData = await resData.json();
		const resData2 = await fetch("http://sos1920-09.herokuapp.com/api/v2/renewable-sources-stats");
		if (resData2.ok) {
			console.log("Ok, api 09 loaded");
			const json = await resData2.json();
            API_09 = json;
			console.log(API_09)
		} else {
			console.log("ERROR!");
        }
		let aux = []
		let valores = []
		MyData.forEach((x) => {
        	if(x.year==2017 && (x.country=="spain"||x.country=="italy")){	
				aux={
					name: x.country,
					data: [0,0,parseInt(x.natality_men),parseInt(x.natality_women)]
				}
				valores.push(aux)
			}
        });
		API_09.forEach((x) => {
            if(x.year==2016 && (x.country=="Italy"||x.country=="Spain")){	
				aux={
					name: x.country,
					data: [x.percentage-hydropower-total*100,x.percentage-wind-power-total*100,0,0]
				}
				valores.push(aux)
			}  	
		

        });

        Highcharts.chart('container', {
			chart: {
				type: 'column'
			},
			title: {
				text: 'Natalidad y Energías Renovables'
			},
			xAxis: {
				categories: ["Porcentaje H", "Porcentaje SFs", "Natalidad Hombres", "Natalidad Mujeres"]
			},
			yAxis: {
				min: 0,
				title: {
					text: 'Numero'
				},
				stackLabels: {
					enabled: true,
					style: {
						fontWeight: 'bold',
						color: ( // theme
							Highcharts.defaultOptions.title.style &&
							Highcharts.defaultOptions.title.style.color
						) || 'gray'
					}
				}
			},
			legend: {
				align: 'right',
				x: -30,
				verticalAlign: 'top',
				y: 25,
				floating: true,
				backgroundColor:
					Highcharts.defaultOptions.legend.backgroundColor || 'white',
				borderColor: '#CCC',
				borderWidth: 1,
				shadow: false
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
			series: parsed_data
		});
	};
</script>

<svelte:head>
	<script src="https://code.highcharts.com/highcharts.js"></script>
	<script src="https://code.highcharts.com/modules/exporting.js"></script>
	<script src="https://code.highcharts.com/modules/export-data.js"></script>
    <script src="https://code.highcharts.com/modules/accessibility.js" on:load="{loadGraph}"></script>
</svelte:head>
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
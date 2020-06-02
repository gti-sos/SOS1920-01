<script>
	import {pop} from "svelte-spa-router";
    import Button from "sveltestrap/src/Button.svelte";

	async function loadGraph(){

        let MyData = [];
	    let API_G02 = [];
		
		const resData = await fetch("/api/v2/natality-stats");
		MyData = await resData.json();
		
        const resDataI = await fetch("https://sos1920-02.herokuapp.com/api/v2/rural-tourism-stats");
		if (resDataI.ok) {
            console.log("Ok, api 02 loaded");
			const json = await resDataI.json();
           
         API_G02 = json;
            console.log(API_G02)
        } else {
			console.log("ERROR!");
        }

		let aux = []
		let valores = []
		MyData.forEach((x) => {
        	if(x.year==2015 && (x.country=="spain"||x.country=="germany")){	
				aux={
					name: x.country,
					data: [0,0,parseInt(x.natality_men),parseInt(x.natality_women)]
				}
				valores.push(aux)
			}
        });
		API_G02.forEach((x) => {
            if(x.year==2015 && (x.province=="sevilla"||x.province=="malaga")){	
				aux={
					name: x.province,
					data: [parseInt(x.traveller),parteInt(x.overnightstay),0,0]
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
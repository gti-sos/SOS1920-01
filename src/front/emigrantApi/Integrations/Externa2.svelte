<script>
	import {pop} from "svelte-spa-router";
    import Button from "sveltestrap/src/Button.svelte";
	async function loadGraph(){

	    let MisDatos = [];
	    let Externa2 = [];
    
	    const EmigrantDatos = await fetch("/api/v1/emigrants-stats");
	    MisDatos = await EmigrantDatos.json();

        const DatosExternos = await fetch("https://coronavirus-19-api.herokuapp.com/countries");
		if (DatosExternos.ok) {
			console.log("Externa2 cargado");
			const json = await DatosExternos.json();
            Externa2 = json;
			console.log(Externa2)
		} else {
			console.log("ERROR!");
        }
		let aux = []
        let valores = []
        
        MisDatos.forEach((x) => {
        	if(x.year==2010 && (x.country=="spain"||x.country=="germany")){	
				aux={
					name: x.country,
					data: [0,0,parseInt(x.em_man)/10, parseInt(x.em_woman)/10]
				}
				valores.push(aux)
			}
        });
		Externa2.forEach((x) => {
            if((x.country=="Mexico"||x.country=="Canada")){	
				aux={
					name: x.country,
					data: [parseInt(x.deaths),parseInt(x.recovered),0,0]
				}
				valores.push(aux)
			}  	
		

        });
    Highcharts.chart('container', {
        chart: {
            type: 'areaspline'
        },
        title: {
            text: 'G01 - Externa2'
        },
        legend: {
            layout: 'vertical',
            align: 'left',
            verticalAlign: 'top',
            x: 150,
            y: 100,
            floating: true,
            borderWidth: 1,
            backgroundColor:
                Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF'
        },
        xAxis: {
            categories: [
                'deaths',
                'recovered',
                'em_man',
                'em_woman'
            ],
            plotBands: [{ // visualize the weekend
                from: 4.5,
                to: 6.5,
                color: 'rgba(68, 170, 213, .2)'
            }]
        },
        yAxis: {
            title: {
                text: 'Unidades'
            }
        },
        tooltip: {
            shared: true,
            valueSuffix: ' units'
        },
        credits: {
            enabled: false
        },
        plotOptions: {
            areaspline: {
                fillOpacity: 0.5
            }
        },
        series:  valores
        
    });
}
</script>

    <svelte:head>
        <script src="https://code.highcharts.com/modules/exporting.js"></script>
        <script src="https://code.highcharts.com/modules/export-data.js"></script>
        <script src="https://code.highcharts.com/highcharts.js"></script>
        <script src="https://code.highcharts.com/modules/accessibility.js" on:load="{loadGraph}"></script>
    </svelte:head>
<main>
    <figure class="highcharts-figure">
        <div id="container"></div>
        <p class="highcharts-description">
            Relación entre emigrantes(/10 para observar mejor los datos en la gráfica) e las muertes y recuperaciones a causa del covid-19
        </p>
        <Button outline color="secondary" on:click="{pop}"> <i class="fas fa-arrow-circle-left"></i> Atrás </Button>
    </figure>
</main>

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
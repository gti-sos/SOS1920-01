<script>
async function loadGraph() {
	
	let MyData = [];
	let MyDataGraph = [];
	
	const resData = await fetch("/api/v2/poverty-stats");
	MyData = await resData.json();
	MyData.forEach( (x) => {
            MyDataGraph.push(
            {name:x.country + " " + x.year, 
            data: ['',parseInt(x.poverty_prp), parseInt(x.poverty_pt), parseInt(x.poverty_ht),''],
             pointPlacement: 'on'},
          );
        });
    Highcharts.chart('container', {
    chart: {
        type: 'bar'
    },
    title: {
        text: 'Riesgo de pobreza'
    },
    
    xAxis: {
        categories: ['','Personas en riesgo de pobreza', 'Umbral de personas', 'Umbral de pobreza',''],
        title: {
            text: null
        }
    },
    yAxis: {
        min: 0,
        title: {
            text: 'Población (millions)',
            align: 'high'
        },
        labels: {
            overflow: 'justify'
        }
    },
    tooltip: {
        valueSuffix: ' millions'
    },
    plotOptions: {
        bar: {
            dataLabels: {
                enabled: true
            }
        }
    },
    legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        x: -40,
        y: 80,
        floating: false,
        borderWidth: 1,
        backgroundColor:
            Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF',
        shadow: true
    },
    credits: {
        enabled: false
    },
		series: MyDataGraph
    });
}
</script>
<svelte:head>

<script src="https://code.highcharts.com/highcharts.js"></script>
<script src="https://code.highcharts.com/modules/exporting.js"></script>
<script src="https://code.highcharts.com/modules/export-data.js"></script>
<script src="https://code.highcharts.com/modules/accessibility.js" on:load="{loadGraph}"></script>
<script src="https://code.highcharts.com/modules/accessibility.js" ></script>

</svelte:head>

<main>
<figure class="highcharts-figure">
    <div id="container"></div>
    <p class="highcharts-description">
        En la gráfica se puede observar como afecta el riesgo de pobreza en la poblacion mundial.

    </p>
</figure>
</main>

<style>
    .highcharts-figure, .highcharts-data-table table {
    min-width: 310px; 
    max-width: 1000px;
    margin: 1em auto;
}

#container {
    height: 600px;
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
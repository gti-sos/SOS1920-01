<script>
	import Button from "sveltestrap/src/Button.svelte";
    import {
        pop
    } from "svelte-spa-router";
    async function loadGraph() {
        
        let MyData = [];
        let MyDataGraph = [];
        
        const resData = await fetch("/api/v2/natality-stats");
        MyData = await resData.json();
        MyData.forEach( (x) => {
                MyDataGraph.push({name: x.country + " " + x.year, data: ['',parseInt(x.natality_men), parseInt(x.natality_women), 
                parseInt(x.natality_totals),''], pointPlacement: 'on'});
            });
            //Las dos comillas son para que me salgan todas las barras, meto una varibale vacía para ello.


    Highcharts.chart('container', {
    chart: {
        type: 'column'
    },
    title: {
        text: '🤰NATALIDAD🤰',
    },
    xAxis: {
        categories: [
            '',
            'Natalidad en Hombres',
            'Natalidad en Mujeres',
            'Natalidad Total',
            ''
        ],
        crosshair: true
    },
    yAxis: {
        min: 0,
        title: {
            text: 'Número de nacimientos'
        }
    },
    tooltip: {
        headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
        pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
            '<td style="padding:0"><b>{point.y:.1f} mil personas</b></td></tr>',
        footerFormat: '</table>',
        shared: true,
        useHTML: true
    },
    plotOptions: {
        column: {
            pointPadding: 0.2,
            borderWidth: 0
        }
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
        
    </svelte:head>
    
    <main>
        <figure class="highcharts-figure">
            <div id="container"></div>
            <p class="highcharts-description">
                <i>En la gráfica podemos observar la representación de la natalidad, 
                en número de nacimientos, total, en hombres y mujeres de algunos países del mundo.</i>
            </p>
        </figure>

        <p></p>
    <Button outline color="secondary" on:click="{pop}"> <i class="fas fa-arrow-circle-left"></i> Atrás </Button>
    
    </main>
    <style>
        #container {
    height: 450px; 
}

.highcharts-figure, .highcharts-data-table table {
    min-width: 310px; 
    max-width: 800px;
    margin: 2em auto;
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
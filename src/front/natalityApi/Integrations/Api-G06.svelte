<script>
    import {pop} from "svelte-spa-router";
	import Table from "sveltestrap/src/Table.svelte";
    import Button from "sveltestrap/src/Button.svelte";
    async function loadGraph() {
    
        let MyData = [];
        let MyDataGraph = [];
        let Data06 = [];
        console.log("Loading integration API 06...");
        const res = await fetch("/api/v2/accstats");
        if (res.ok) {
            console.log("Loaded correctly");
            const json = await res.json();
            Data06 = json;
        } else {
            console.log("ERROR!");
        }
        const resData = await fetch("/api/v2/natality-stats");
        MyData = await resData.json();
        MyData.forEach( (x) => {
            Data06.forEach( (y) => {
                if (y.province.toLowerCase() == x.country && x.year != 2015) {
                    MyDataGraph.push({name: x.province, data: [parseInt(x.natality_totals), parseInt(x.natality_men), parseInt(x.natality_women), parseInt(y.accvictotal), parseInt(y.accvicinter), parseInt(y.accfall)]});
                }
            });
        });
        Highcharts.chart('container', {
    chart: {
        type: 'column'
    },
    title: {
        text: '🤰NATALIDAD Y TURISMO RURAL EN 2010',
    },
    xAxis: {
        categories: [
            'Viajeros',
            'Pernoctaciones',
            'Natalidad en Hombres',
            'Natalidad en Mujeres'

        ],
        crosshair: true
    },
    yAxis: {
        min: 0,
        title: {
            text: ''
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
        <figure class="highcharts-figure">
            <div id="container"></div>
            <p class="highcharts-description">
                <br>
                <i>En la gráfica podemos observar la representación de la natalidad, 
                con número de nacimientos, en hombres y mujeres de algunos países del mundo.</i>
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
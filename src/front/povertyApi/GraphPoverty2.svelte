<script>
    async function loadGraph() {

        let MyData = [];
        let MyDataGraph = [];

        const resData = await fetch("/api/v2/poverty-stats");
        MyData = await resData.json();
        MyData.forEach( (x) => {
            if (x.year == 2017) {
                MyDataGraph.push({country: x.country, poverty_prp: [parseInt(x.poverty_prp)]});

            }
        });


        am4core.ready(function() {
            // Themes begin
            am4core.useTheme(am4themes_kelly);

            // Create chart instance
            var chart = am4core.create("chartdiv", am4charts.PieChart);

            // Add data
            chart.data = MyDataGraph;
            // Set inner radius
            chart.innerRadius = am4core.percent(35);
            // Add and configure Series
            var pieSeries = chart.series.push(new am4charts.PieSeries());
            pieSeries.dataFields.value = "poverty_prp";
            pieSeries.dataFields.category = "country";
            pieSeries.slices.template.stroke = am4core.color("#fff");
            pieSeries.slices.template.strokeWidth = 2;
            pieSeries.slices.template.strokeOpacity = 1;
            // This creates initial animation
            pieSeries.hiddenState.properties.opacity = 1;
            pieSeries.hiddenState.properties.endAngle = -90;
            pieSeries.hiddenState.properties.startAngle = -90;
            });
    }
    
    loadGraph();
</script>

<svelte:head>
    	<!-- ANGELA GRAPH2 -->
        <script src="https://www.amcharts.com/lib/4/core.js"></script>
        <script src="https://www.amcharts.com/lib/4/charts.js"></script>
        <script src="https://www.amcharts.com/lib/4/themes/kelly.js"></script>
        <script src="https://www.amcharts.com/lib/4/themes/animated.js" on:load="{loadGraph}"></script>

</svelte:head>

<main>
    <h3 style="text-align: center;"> <i class="fas fa-bicycle"></i> Personas en riesgo pobreza en 2017</h3>	

    <div id="chartdiv"></div>
    <p class="highcharts-description">
       
        La gráfica representa el porcentaje de personas en riesgo de pobreza en 2017.

    </p>
</main>

<style>
     #chartdiv {
      width: 100%;
      height: 500px;
    }
</style>
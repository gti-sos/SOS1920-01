<script>
    import {
        pop
    } from "svelte-spa-router";
    import Button from "sveltestrap/src/Button.svelte";
    
    async function loadGraph() {
        let MyDataN = [];
        let MyDataP = [];
        let MyDataE = [];
        let MyDataGraph = [];
        const resDataN = await fetch("/api/v2/natality-stats");
        MyDataN = await resDataN.json();
        const resDataP = await fetch("/api/v2/poverty-stats");
        MyDataP = await resDataP.json();
        const resDataE = await fetch("/api/v2/emigrants-stats");
        MyDataE = await resDataE.json();
        MyDataN.forEach( (x) => {
            MyDataP.forEach( (y) => {
                MyDataE.forEach( (z) => {
                    if (x.country == y.country && x.country == z.country && x.year == y.year && x.year == z.year) {
                        MyDataGraph.push({name: x.country+" "+x.year, children: [
                            {name: "Natalidad", children: [
                                {name: "Total", value: parseInt(x.matality_totals)},
                                {name: "Hombres", value: parseInt(x.natality_men)},
                                {name: "Mujeres", value: parseInt(x.natality_women)}
                            ]},
                            {name: "Riesgo de Pobreza", children: [
                                {name: "Personas", value: parseInt(y.poverty_prp)},
                                {name: "Umbral de personal", value: parseInt(y.poverty_pt)},
                                {name: "Umbral del hogar", value: parseInt(y.poverty_ht)}
                            ]},
                            {name: "Emigracion", children: [
                                {name: "Total", value: parseFloat(z.em_totals)},
                                {name: "Hombres", value: parseFloat(z.em_man)},
                                {name: "Mujeres", value: parseFloat(z.em_woman)}
                            ]}
                        ]});
                    } 
                })
            });
        });
        
        
        // Themes begin
am4core.useTheme(am4themes_kelly);
am4core.useTheme(am4themes_animated);
// Themes end

// create chart
var chart = am4core.create("chartdiv", am4plugins_sunburst.Sunburst);
chart.padding(0,0,0,0);
chart.radius = am4core.percent(98);

chart.data = MyDataGraph;

chart.colors.step = 2;
chart.fontSize = 11;
chart.innerRadius = am4core.percent(10);

// define data fields
chart.dataFields.value = "value";
chart.dataFields.name = "name";
chart.dataFields.children = "children";


var level0SeriesTemplate = new am4plugins_sunburst.SunburstSeries();
level0SeriesTemplate.hiddenInLegend = false;
chart.seriesTemplates.setKey("0", level0SeriesTemplate)

// this makes labels to be hidden if they don't fit
level0SeriesTemplate.labels.template.truncate = true;
level0SeriesTemplate.labels.template.hideOversized = true;

level0SeriesTemplate.labels.template.adapter.add("rotation", function(rotation, target) {
  target.maxWidth = target.dataItem.slice.radius - target.dataItem.slice.innerRadius - 10;
  target.maxHeight = Math.abs(target.dataItem.slice.arc * (target.dataItem.slice.innerRadius + target.dataItem.slice.radius) / 2 * am4core.math.RADIANS);

  return rotation;
})


var level1SeriesTemplate = level0SeriesTemplate.clone();
chart.seriesTemplates.setKey("1", level1SeriesTemplate)
level1SeriesTemplate.fillOpacity = 0.75;
level1SeriesTemplate.hiddenInLegend = true;

var level2SeriesTemplate = level0SeriesTemplate.clone();
chart.seriesTemplates.setKey("2", level2SeriesTemplate)
level2SeriesTemplate.fillOpacity = 0.5;
level2SeriesTemplate.hiddenInLegend = true;

chart.legend = new am4charts.Legend();


    
    }




loadGraph();
</script>

<svelte:head>
    <script src="https://www.amcharts.com/lib/4/core.js"></script>
    <script src="https://www.amcharts.com/lib/4/charts.js"></script>
    <script src="https://www.amcharts.com/lib/4/plugins/sunburst.js"></script>
    <script src="https://www.amcharts.com/lib/4/themes/kelly.js"></script>
    <script src="https://www.amcharts.com/lib/4/themes/animated.js" on:load="{loadGraph}"></script>
</svelte:head>

<main>
    <h2 style="text-align: center;">Analisis de todos los datos de los miembros de SOS1920-01</h2>
    
    <Button outline color="secondary" on:click="{pop}">Atras</Button>
    <p class="highcharts-description">
        <br>
        <i>Gráfica común a las tres APIs. Representa la natalidad, la emigración y el riesgo de pobreza. Los datos de 
            Riesgo de pobreza son tan pequeños que apenas se aprecian. Para verlo deja marcado un solo país.</i>
    </p>
    <div id="chartdiv"></div>
    


</main>

<style>
    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    }
    #chartdiv {
  height: 650px;
}
</style>
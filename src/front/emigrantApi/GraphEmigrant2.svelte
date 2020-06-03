<script>
	import {pop} from "svelte-spa-router";
    import Button from "sveltestrap/src/Button.svelte";
    import ApexCharts from 'apexcharts'
	async function loadGraph(){

	    let MisDatos = [];
    
	    const EmigrantDatos = await fetch("/api/v1/emigrants-stats");
	    MisDatos = await EmigrantDatos.json();

		let aux = []
        let valores = []
        let valores1 = []
        let valores2 = []
        
        MisDatos.forEach((x) => {
            if (x.country == 'france') {
                aux = parseInt(x.em_totals)
				valores.push(aux);
            }
        });
        MisDatos.forEach((x) => {
            if (x.country == 'france') {
                aux = parseInt(x.em_man)
				valores1.push(aux);
            }
        });
        MisDatos.forEach((x) => {
            if (x.country == 'france') {
                aux = parseInt(x.em_woman)
				valores2.push(aux);
            }
        });

        var options = {
          series: [{
            name: "Francia, emigrantes totales",
            data: valores
        },{
            name: "Francia, emigrantes hombres",
            data: valores1
        },{
            name: "Francia, emigrantes mujeres",
            data: valores2
        }],
    
          chart: {
          height: 350,
          type: 'line',
          zoom: {
            enabled: false
          }
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'straight'
        },
        title: {
          text: 'Emigrantes',
          align: 'left'
        },
        grid: {
          row: {
            colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
            opacity: 0.5
          },
        },
        xaxis: {
          categories: ['2010', '2015', '2017'],
        }
        };

        var chart = new ApexCharts(document.querySelector("#chart"), options);
        chart.render();
      
}
</script>
    <svelte:head>
        <script src="https://cdn.jsdelivr.net/npm/apexcharts" on:load={loadGraph}></script>
    </svelte:head>
<main>
    <div id="chart">
        <div id="timeline-chart"></div>
    </div>
    <p>Emigrantes en Francia en los años 2010 ,2015 , 2017 (Realizada con apexcharts)</p>
</main>
<style>
@import url('https://fonts.googleapis.com/css?family=Poppins');

* {
  font-family: 'Poppins', sans-serif;
}

#chart {
  max-width: 760px;
  margin: 35px auto;
  opacity: 0.9;
}

#timeline-chart .apexcharts-toolbar {
  opacity: 1;
  border: 0;
}
</style>
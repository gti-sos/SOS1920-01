<script>
    import Button from "sveltestrap/src/Button.svelte";
    import {
        pop
    } from "svelte-spa-router";

    async function loadGraph () {
        
        const resData = await fetch("/api/v2/natality-stats");
        let MyData = await resData.json();   
        let datachart = MyData.filter(y => y.year == 2010).map((y) => {return [y.country, y["natality_totals"]];})
        
        var chart = bb.generate({
            data: {
                columns: [],
                type: "gauge",
                onclick: function(y, i) {
                console.log("onclick", y, i);
            },
            },
            gauge: {},
            color: {
                pattern: [
                "#FF0000",
                "#F97600",
                "#F6C600",
                "#60B044"
                ],
                threshold: {
                values: [
                    500000,
                    700000,
                    820000,
                    1000000
                ]
                }
            },
            size: {
                height: 300
            },
            bindto: "#gaugeChart"
        });
        /* Recursive function because settimeout doesnt work properly in loop  */
        function loop_charting (i) {
            setTimeout(function() {
                chart.load({
                    columns: [datachart[i]]
                });
                if (i < datachart.length) {
                    loop_charting (i + 1);
                }
            }, 1000);
            
        }
        loop_charting(0);
    }
    
    loadGraph();
    
    
    
</script>

<svelte:head>


   
</svelte:head>

<main>
    

    <div id="gaugeChart"></div>

    <p><i>Gráfica, representada mediante Billboard.js, presenta el porcentje de natalidad total de algunos países en el año 2010.</i></p>
    <Button outline color="secondary" on:click="{pop}"> <i class="fas fa-arrow-circle-left"></i> Atrás </Button>
</main>
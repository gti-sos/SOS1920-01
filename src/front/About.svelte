<script>
	import Button from "sveltestrap/src/Button.svelte";
    import {
        pop
    } from "svelte-spa-router";
	
</script>

<main>
  <h1 class="display-4" style="text-align: center;" > Vídeos integrantes Grupo 1 </h1>
      
	<Button outline color="secondary" on:click="{pop}"><i class="fas fa-arrow-circle-left"></i> Atrás </Button>
  <p></p>
  <div class="card-deck">
        <div class="card">
            <div class="embed-responsive embed-responsive-16by9 video">
              <iframe width="560" height="315" src="https://www.youtube.com/embed/AGzRzDOGhd0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
          <div class="card-body">
            <h5 class="card-title">Natalidad</h5>
            <p class="card-text">Vídeo explicativo sobre datos de natalidad en varios países.</p>
          </div>
        </div>

        <div class="card">
            <div class="embed-responsive embed-responsive-16by9 video">
              <iframe width="560" height="315" src="https://www.youtube.com/embed/cBhaOamldPU" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
          <div class="card-body">
            <h5 class="card-title">Pobreza</h5>
            <p class="card-text">Vídeo explicativo sobre los riegos de pobreza en varios países.</p>
          </div>
        </div>

        <div class="card">
            <div class="embed-responsive embed-responsive-16by9 video">
              <iframe width="560" height="315" src="https://www.youtube.com/embed/QsQudV-kSQE" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
          <div class="card-body">
            <h5 class="card-title">Emigración</h5>
            <p class="card-text">Vídeo explicativo sobre la emigración en varios países.</p>
          </div>
        </div>
    </div>
    
    
    
    



</main>
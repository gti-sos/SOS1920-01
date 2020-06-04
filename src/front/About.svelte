<script>
	import Button from "sveltestrap/src/Button.svelte";
    import {
        pop
    } from "svelte-spa-router";
	
</script>

<main>
  <h1 class="display-4" style="text-align: center;" >  </h1>
      
	<Button outline color="secondary" on:click="{pop}"><i class="fas fa-arrow-circle-left"></i> </Button>
  <p></p>
  <div class="card-deck">
        <div class="card">
            <div class="embed-responsive embed-responsive-16by9 video">
              <iframe title="Video Natalidad" width="816" height="441" src="https://youtu.be/AGzRzDOGhd0" allowfullscreen></iframe>
            </div>
          <div class="card-body">
            <h5 class="card-title">Natalidad</h5>
            <p class="card-text">Vídeo explicativo sobre datos de natalidad en varios países.</p>
          </div>
        </div>

        <div class="card">
            <div class="embed-responsive embed-responsive-16by9 video">
                <iframe title="Video Natalidad" width="900" height="506" src="https://youtu.be/cBhaOamldPU" allowfullscreen></iframe>
            </div>
          <div class="card-body">
            <h5 class="card-title">Pobreza</h5>
            <p class="card-text">Vídeo explicativo sobre los riegos de pobreza en varios países.</p>
          </div>
        </div>

        <div class="card">
            <div class="embed-responsive embed-responsive-16by9 video">
              <iframe title="Video Natalidad" width="757" height="409" src="https://youtu.be/QsQudV-kSQE" allowfullscreen></iframe>
            </div>
          <div class="card-body">
            <h5 class="card-title">Emigración</h5>
            <p class="card-text">Vídeo explicativo sobre la emigración en varios países.</p>
          </div>
        </div>
    </div>
    
    
    
    



</main>

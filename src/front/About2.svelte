<script>
    import {pop} from "svelte-spa-router";
    import Button from "sveltestrap/src/Button.svelte";
</script>

<main>
    <h2 style="text-align: center;">Integracion de APIs con compañeros de SOS</h2>
    <br><br>   

    <iframe title="Vídeo 1" class="embed-responsive-item video" src="https://youtu.be/AGzRzDOGhd0" allowfullscreen></iframe>
	<button type="button" class="btn btn-secondary" onclick="window.location.href='#/poverty-stats/Integrations'" style="width: 25%;">Pobreza</button>
	<button type="button" class="btn btn-secondary" onclick="window.location.href='#/emigrants-stats/Integrations'" style= "width: 25%;">Emigración </button><br><br>

    <Button outline color="secondary" on:click="{pop}">Volver</Button>

</main>
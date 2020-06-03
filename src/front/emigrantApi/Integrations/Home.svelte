<script>
    import {
        pop
    } from "svelte-spa-router";
    import Button from "sveltestrap/src/Button.svelte";
</script>
<h2><strong> Integraciones con Emigrantes</strong></h2>
<br><br>
<p>
    <Button outline color="secondary" on:click="{pop}"> <i class="fas fa-arrow-circle-left"></i> Atrás </Button>
</p>
<p>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/emigrants-stats/G05'"style="margin-left: 10%; width: 20%;">API Grupo 05</button>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/emigrants-stats/G06'"style="margin-left: 10%; width: 20%;">API Grupo 06</button>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/emigrants-stats/G07'"style="margin-left: 10%; width: 20%;">API Grupo 07</button>
    <br><br>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/emigrants-stats/G08'"style="margin-left: 10%; width: 20%;">API Grupo 08</button>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/emigrants-stats/G09'"style="margin-left: 10%; width: 20%;">API Grupo 09</button>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/emigrants-stats/G12'"style="margin-left: 10%; width: 20%;">API Grupo 12</button>
    <br><br>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/emigrants-stats/G22'"style="margin-left: 10%; width: 20%;">API Grupo 22</button>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/emigrants-stats/G23'"style="margin-left: 10%; width: 20%;">API Grupo 23</button>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/emigrants-stats/G26'"style="margin-left: 10%; width: 20%;">API Grupo 26</button>
    <br><br>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/emigrants-stats/G30'"style="margin-left: 10%; width: 20%;">API Grupo 30</button>
    <button type="button" class="btn btn-danger" onclick="window.location.href='#/emigrants-stats/Externa1'"style="margin-left: 10%; width: 20%;">API Externo 01</button>
    <button type="button" class="btn btn-danger" onclick="window.location.href='#/emigrants-stats/Externa2'"style="margin-left: 10%; width: 20%;">API Externo 02</button>
    <br><br>
    </p>
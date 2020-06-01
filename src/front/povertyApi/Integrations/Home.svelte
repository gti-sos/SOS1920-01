<script>
    import {
        pop
    } from "svelte-spa-router";
    import Button from "sveltestrap/src/Button.svelte";
</script>
<h2><strong> Integraciones con Riesgo de Pobreza</strong></h2>
<br><br>
<p>
    <Button outline color="secondary" on:click="{pop}"> <i class="fas fa-arrow-circle-left"></i> Atrás </Button>
</p>
<p>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/poverty-stats/sos1920-04'"style="margin-left: 10%; width: 20%;">API Grupo 04</button>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/poverty-stats/sos1920-05'"style="margin-left: 10%; width: 20%;">API Grupo 05</button>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/poverty-stats/sos1920-06'"style="margin-left: 10%; width: 20%;">API Grupo 06</button>
    <br><br>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/poverty-stats/sos1920-07'"style="margin-left: 10%; width: 20%;">API Grupo 07</button>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/poverty-stats/sos1920-08'"style="margin-left: 10%; width: 20%;">API Grupo 08</button>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/poverty-stats/sos1920-09'"style="margin-left: 10%; width: 20%;">API Grupo 09</button>
    <br><br>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/poverty-stats/sos1920-10'"style="margin-left: 10%; width: 20%;">API Grupo 10</button>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/poverty-stats/sos1920-21'"style="margin-left: 10%; width: 20%;">API Grupo 21</button>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/poverty-stats/sos1920-22'"style="margin-left: 10%; width: 20%;">API Grupo 22</button>
    <br><br>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/poverty-stats/sos1920-28'"style="margin-left: 10%; width: 20%;">API Grupo 28</button>
    <button type="button" class="btn btn-danger" onclick="window.location.href='#/poverty-stats/ex-01'"style="margin-left: 10%; width: 20%;">API Externo 01</button>
    <button type="button" class="btn btn-danger" onclick="window.location.href='#/poverty-stats/ex-02'"style="margin-left: 10%; width: 20%;">API Externo 02</button>
    <br><br>
    </p>
<script>
    import {pop} from "svelte-spa-router";
    import Button from "sveltestrap/src/Button.svelte";
</script>

<main>
    <h2 style="text-align: center;"> Integración con APIs de compañeros de SOS</h2>
    <br><br>       

    <button type="button" class="btn btn-primary" onclick="window.location.href='#/natality-stats/API-G02'"style="margin-left: 10%; width: 20%;"> API Grupo 02</button>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/natality-stats/API-G04'"style="margin-left: 10%; width: 20%;"> API Grupo 04</button>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/natality-stats/API-G05'"style="margin-left: 10%; width: 20%;"> API Grupo 05</button>
    <br><br>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/natality-stats/API-G06'"style="margin-left: 10%; width: 20%;"> API Grupo 06</button>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/natality-stats/API-G08'"style="margin-left: 10%; width: 20%;"> API Grupo 08</button>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/natality-stats/API-G09'"style="margin-left: 10%; width: 20%;"> API Grupo 09</button>
    <br><br>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/natality-stats/API-G11'"style="margin-left: 10%; width: 20%;"> API Grupo 11</button>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/natality-stats/API-G21'"style="margin-left: 10%; width: 20%;"> API Grupo 21</button>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/natality-stats/API-G23'"style="margin-left: 10%; width: 20%;"> API Grupo 23</button>
    <br><br>
    <button type="button" class="btn btn-primary" onclick="window.location.href='#/natality-stats/API-G28'"style="margin-left: 10%; width: 20%;"> API Grupo 28</button>
    <button type="button" class="btn btn-danger" onclick="window.location.href='#/natality-stats/API-Ext1'"style="margin-left: 10%; width: 20%;"> API Externa 1</button>
    <button type="button" class="btn btn-danger" onclick="window.location.href='#/natality-stats/API-Ext2'"style="margin-left: 10%; width: 20%;"> API Externa 2</button>
    <br><br>

    <Button outline color="secondary" on:click="{pop}"> <i class="fas fa-arrow-circle-left"></i> Atrás </Button>
</main>
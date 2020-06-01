<script>
    import Router from 'svelte-spa-router';
    import Home from './Home.svelte';
    import NotFound from './NotFound.svelte';
    import Integrations from './Integrations.svelte';

// API JUANFRAN
    import NatalityTable from './natalityApi/NatalityTable.svelte';
    import EditNatality from './natalityApi/EditNatality.svelte';
    import GraphNatality from './natalityApi/GraphNatality.svelte';
    import GraphNatalityV2 from './natalityApi/GraphNatalityV2.svelte';
// INTEGRACIONES 
    import HomeIntegrations from './natalityApi/Integrations/HomeIntegrations.svelte';
    import Api_G09 from './natalityApi/Integrations/Api-G09.svelte';
    import Api_G02 from './natalityApi/Integrations/Api-G02.svelte';
    
// API ANGELA
    import PovertyTable from './povertyApi/PovertyTable.svelte';
    import EditPoverty from './povertyApi/EditPoverty.svelte';
    import GraphPoverty from './povertyApi/GraphPoverty.svelte';
    import GraphPoverty2 from './povertyApi/GraphPoverty2.svelte';
    import PovertyIntegrations from './povertyApi/Integrations/Home.svelte';
    import API04 from './povertyApi/Integrations/sos1920-04.svelte';
    import API05 from './povertyApi/Integrations/sos1920-05.svelte';
    import API06 from './povertyApi/Integrations/sos1920-06.svelte';
    import API07 from './povertyApi/Integrations/sos1920-07.svelte';
    import API08 from './povertyApi/Integrations/sos1920-08.svelte';
    import API09 from './povertyApi/Integrations/sos1920-09.svelte';
    import API10 from './povertyApi/Integrations/sos1920-10.svelte';
    import API21 from './povertyApi/Integrations/sos1920-21.svelte';
    import API22 from './povertyApi/Integrations/sos1920-22.svelte';
    import API28 from './povertyApi/Integrations/sos1920-28.svelte';
    import APIex1 from './povertyApi/Integrations/ex-01.svelte';
    import APIex2 from './povertyApi/Integrations/ex-02.svelte';
// API ESCOBAR
    import EmigrantTable from './emigrantApi/EmigrantTable.svelte';
    import EditEmigrant from './emigrantApi/EditEmigrant.svelte';


    const routes = {
        "/": Home,
        "/integrations": Integrations,
    // JUANFRAN
        "/natality-stats": NatalityTable,
		"/natality-stats/:country/:year": EditNatality,
        "/natality-stats/graph": GraphNatality,
        "/natality-stats/graphV2": GraphNatalityV2,
    // INTEGRACIONES JUANFRAN    
        "/integrations/natality-stats": HomeIntegrations,
        "/integrations/natality-stats/Api-G02" : Api_G02,
        "/integrations/natality-stats/Api-G09" : Api_G09,
        
    // ANGELA
		"/poverty-stats": PovertyTable,
		"/poverty-stats/:country/:year": EditPoverty,
        "/poverty-stats/graph": GraphPoverty,
        "/poverty-stats/graph2": GraphPoverty2,
        "/poverty-stats/integrations": PovertyIntegrations,
        "/poverty-stats/sos1920-04":API04,
        "/poverty-stats/sos1920-05":API05,
        "/poverty-stats/sos1920-06":API06,
        "/poverty-stats/sos1920-07":API07,
        "/poverty-stats/sos1920-08":API08,
        "/poverty-stats/sos1920-09":API09,
        "/poverty-stats/sos1920-10":API10,
        "/poverty-stats/sos1920-21":API21,
        "/poverty-stats/sos1920-22":API22,
        "/poverty-stats/sos1920-28":API28,
        "/poverty-stats/ex-01":APIex1,
        "/poverty-stats/ex-02":APIex2,
	// ESCOBAR	
        "/emigrants-stats": EmigrantTable,
		"/emigrants-stats/:country/:year": EditEmigrant,
    

		"*": NotFound
	};
</script>

<main>
    <Router {routes} />
</main>
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
	// ESCOBAR	
        "/emigrants-stats": EmigrantTable,
		"/emigrants-stats/:country/:year": EditEmigrant,
    

		"*": NotFound
	};
</script>

<main>
    <Router {routes} />
</main>
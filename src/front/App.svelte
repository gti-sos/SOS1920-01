<script>
    import Router from 'svelte-spa-router';
    import Home from './Home.svelte';
    import NotFound from './NotFound.svelte';

// API JUANFRAN
    import NatalityTable from './natalityApi/NatalityTable.svelte';
    import EditNatality from './natalityApi/EditNatality.svelte';
    import GraphNatality from './natalityApi/GraphNatality.svelte';
    import GraphNatalityV2 from './natalityApi/GraphNatalityV2.svelte';
// API ANGELA
    import PovertyTable from './povertyApi/PovertyTable.svelte';
    import EditPoverty from './povertyApi/EditPoverty.svelte';

// API ESCOBAR
    import EmigrantTable from './emigrantApi/EmigrantTable.svelte';
    import EditEmigrant from './emigrantApi/EditEmigrant.svelte';


    const routes = {
		"/": Home,
    // JUANFRAN
        "/natality-stats": NatalityTable,
		"/natality-stats/:country/:year": EditNatality,
        "/natality-stats/graph": GraphNatality,
        "/natality-stats/graphV2": GraphNatalityV2,
    // ANGELA
		"/poverty-stats": PovertyTable,
		"/poverty-stats/:country/:year": EditPoverty,
	// ESCOBAR	
        "/emigrants-stats": EmigrantTable,
		"/emigrants-stats/:country/:year": EditEmigrant,
    

		"*": NotFound
	};
</script>

<main>
    <Router {routes} />
</main>
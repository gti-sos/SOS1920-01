<script>
    import Router from 'svelte-spa-router';
    import Home from './Home.svelte';
    import NotFound from './NotFound.svelte';

// API JUANFRAN
    import NatalityTable from './natalityApi/NatalityTable.svelte';
    import EditNatality from './natalityApi/EditNatality.svelte';
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
    // JUANFRA
        "/natality-stats": NatalityTable,
		"/natality-stats/:country/:year": EditNatality,
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
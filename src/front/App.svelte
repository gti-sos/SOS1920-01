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

// API ESCOBAR

    const routes = {
		"/": Home,
	// JUANFRAN
        "/natality-stats": NatalityTable,
		"/natality-stats/:country/:year": EditNatality,
    // ANGELA
		"/poverty-stats": PovertyTable,
		"/poverty-stats/:country/:year": EditPoverty,
	// ESCOBAR	
		
		"*": NotFound
	};
</script>

<main>
    <Router {routes} />
</main>
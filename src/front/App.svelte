<script>
    import Router from 'svelte-spa-router';
    import Home from './Home.svelte';

// API JUANFRAN

// API ANGELA
    import PovertyTable from './povertyApi/PovertyTable.svelte';
    import EditNPoverty from './povertyApi/EditPoverty.svelte';

// API ESCOBAR

    const routes = {
		"/": Home,
	// JUANFRAN

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
<script>
    import Router from 'svelte-spa-router';
    import Home from './Home.svelte';
    import NotFound from './NotFound.svelte';

    import Analytics from './Analytics.svelte';

// API JUANFRAN
    import NatalityTable from './natalityApi/NatalityTable.svelte';
    import EditNatality from './natalityApi/EditNatality.svelte';
    import GraphNatality from './natalityApi/GraphNatality.svelte';
    import GraphNatalityV2 from './natalityApi/GraphNatalityV2.svelte';
// INTEGRACIONES 
    import HomeIntegrations from './natalityApi/Integrations/HomeIntegrations.svelte';
    import API_G02 from './natalityApi/Integrations/Api-G02.svelte';
    import API_G04 from './natalityApi/Integrations/Api-G04.svelte';
    import API_G05 from './natalityApi/Integrations/Api-G05.svelte';
    import API_G06 from './natalityApi/Integrations/Api-G06.svelte';
    import API_G08 from './natalityApi/Integrations/Api-G08.svelte';
    import API_G09 from './natalityApi/Integrations/Api-G09.svelte';
    import API_G11 from './natalityApi/Integrations/Api-G11.svelte';
    import API_G21 from './natalityApi/Integrations/Api-G21.svelte';
    import API_G23 from './natalityApi/Integrations/Api-G23.svelte';
    import API_G28 from './natalityApi/Integrations/Api-G28.svelte';
    import API_Ext1 from './natalityApi/Integrations/Api-Ext1.svelte';
    import API_Ext2 from './natalityApi/Integrations/Api-Ext2.svelte';

    

    
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
    import GraphEmigrant from './emigrantApi/GraphEmigrant.svelte';
    import GraphEmigrant2 from './emigrantApi/GraphEmigrant2.svelte';
    import G05 from './emigrantApi/Integrations/G05.svelte';
    import G06 from './emigrantApi/Integrations/G06.svelte';
    import G07 from './emigrantApi/Integrations/G07.svelte';
    import G08 from './emigrantApi/Integrations/G08.svelte';
    import G09 from './emigrantApi/Integrations/G09.svelte';
    import G12 from './emigrantApi/Integrations/G12.svelte';
    import G22 from './emigrantApi/Integrations/G22.svelte';
    import G23 from './emigrantApi/Integrations/G23.svelte';
    import G26 from './emigrantApi/Integrations/G26.svelte';
    import G30 from './emigrantApi/Integrations/G30.svelte';
    import Externa1 from './emigrantApi/Integrations/Externa1.svelte';
    import Externa2 from './emigrantApi/Integrations/Externa2.svelte';

    const routes = {
        "/": Home,
        "/Analytics": Analytics,
    // JUANFRAN
        "/natality-stats": NatalityTable,
		"/natality-stats/:country/:year": EditNatality,
        "/natality-stats/graph": GraphNatality,
        "/natality-stats/graphV2": GraphNatalityV2,
    // INTEGRACIONES JUANFRAN    
        "/natality-stats/integrations": HomeIntegrations,
        "/natality-stats/API-G02" : API_G02,
        "/natality-stats/API-G04" : API_G04,
        "/natality-stats/API-G05" : API_G05,
        "/natality-stats/API-G06" : API_G06,
        "/natality-stats/API-G08" : API_G08,
        "/natality-stats/API-G09" : API_G09,
        "/natality-stats/API-G11" : API_G11,
        "/natality-stats/API-G21" : API_G21,
        "/natality-stats/API-G23" : API_G23,
        "/natality-stats/API-G28" : API_G28,
        "/natality-stats/API-Ext1" : API_Ext1,
        "/natality-stats/API-Ext2" : API_Ext2,

      
        
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
        "/emigrants-stats/graph": GraphEmigrant,
        "/emigrants-stats/graph2": GraphEmigrant2,
        "/emigrants-stats/G05":G05,
        "/emigrants-stats/G06":G06,
        "/emigrants-stats/G07":G07,
        "/emigrants-stats/G08":G08,
        "/emigrants-stats/G09":G09,
        "/emigrants-stats/G12":G12,
        "/emigrants-stats/G22":G22,
        "/emigrants-stats/G23":G23,
        "/emigrants-stats/G26":G26,
        "/emigrants-stats/G30":G30,
        "/emigrants-stats/Externa1":Externa1,
        "/emigrants-stats/Externa2":Externa2,
		"*": NotFound
	};
</script>

<main>
    <Router {routes} />
</main>

    
    //////////////////////////////////////////////////////////////////////
    app.get(BASE_PATH+"/poverty-stats",(req,res) =>{
        var limit = parseInt(req.query.limit);
        var offset = parseInt(req.query.offset);
        var search = {};
        
        if(req.query.country) search['country'] = req.query.country;
        if(req.query.year) search['year'] = parseInt(req.query.year);
        
        /////primer atributo --- poverty_prp
        
        if(req.query.poverty_prpMin && req.query.poverty_prpMax)
            search['poverty_prp'] = {
                $gte: parseInt(req.query.poverty_prpMin),
                $lte: parseInt(req.query.poverty_prpMax)
            }
        if(req.query.poverty_prpMin && !req.query.poverty_prpMax)
            search['poverty_prp'] = {$gte: parseInt(req.query.poverty_prpMin)};
        if(!req.query.poverty_prpMin && req.query.poverty_prpMax)
            search['poverty_prp'] = {$lte: parseInt(req.query.poverty_prpMax)}
        
        /////segundo atributo --- poverty_pt
        
        if(req.query.poverty_ptMin && req.query.poverty_ptMax)
            search['poverty_pt'] = {
                $gte: parseInt(req.query.poverty_ptMin),
                $lte: parseInt(req.query.poverty_ptMax)
            }
        if(req.query.poverty_ptMin && !req.query.poverty_ptMax)
            search['poverty_prp'] = {$gte: parseInt(req.query.poverty_ptMin)};
        if(!req.query.poverty_ptMin && req.query.poverty_ptMax)
            search['poverty_prp'] = {$lte: parseInt(req.query.poverty_ptMax)}
        
        /////tercer atrbuto --- poverty_ht
        
        if(req.query.poverty_htMin && req.query.poverty_htMax)
            search['poverty_ht'] = {
                $gte: parseInt(req.query.poverty_htMin),
                $lte: parseInt(req.query.poverty_htMax)
            }
        if(req.query.poverty_htMin && !req.query.poverty_htMax)
            search['poverty_ht'] = {$gte: parseInt(req.query.poverty_htMin)};
        if(!req.query.poverty_htMin && req.query.poverty_htMax)
            search['poverty_ht'] = {$lte: parseInt(req.query.poverty_htMax)}
        
        pdb.find(search).skip(offset).limit(limit).exec(function(err, pov){
                pov.forEach((i)=>{
                    delete i._id
                });
            
            if(pov == 0){
                res.sendStatus(404, "Poverty Not Found");
            }else{
                console.log("Data sent: "+JSON.stringify(pov, null,2));
                res.send(JSON.stringify(pov, null, 2));
                
            }	
        });
        /*	console.log("New GET .../poverty_stats");
        pdb.find({}, (error, pov) => { 
            pov.forEach((i)=>{
                    delete i._id
                });
            res.send(JSON.stringify(pov,null,2));
            
        });*/
    });
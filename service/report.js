const Loadboard = require("../models/loadboard");
const Reports = require("../models/reports");
const { param } = require("../routes/loadboard");
const nconf = require('nconf');
const converter = require("../helper/converter");
nconf.env();

async function formatRequest(parameters,errors,response,addFields, switchQuery){
    var query = {},
        sort = {};
    //debugger;
    if ( parameters.report !== undefined && parameters.report !== "null" && errors.length == 0 )
    {
        const report = parameters.report;

        if (report == null||report == "") {
            errors.push({ message: "Report query *requires* a string." });
        }
        
        //
        //  Report functions as a **default** query store,
        //  if there is a existing query in the url this
        //  will not replace it.
        //
        await Reports.find({"name":{ $eq: report }}, { }, {lean: true}).then((reportdata, err) => {
            //debugger;
            return new Promise((resolve, reject) => {
                
                if ( reportdata.length < 1)
                {
                    reject('Report name invalid.');
                }
                var queries = reportdata[0].table.query;
                for(let queryKey in queries){
                    let query = queries[queryKey];
                    if ( !parameters[queryKey] )
                        parameters[queryKey] = query;
                }
                resolve(reportdata[0]);
            });
        }).then(function success(reportdta) {
                response.reports = [reportdta];
                nconf.use('currentTable', { currentTable:{
                    tableConfig: [reportdta]
                }, type: 'literal'});
            }, function error(err) {
                errors.push({ message: err });
        }).catch(function(err) { console.log(err); });

    }

    // filter
    if (parameters.stops !== undefined ) {
        var stops = parameters.stops;
        var number = !parseInt(parameters.stops.split(/\>|\</)[1]) ? (!parseInt(parameters.stops.split(/\>|\</)[0]) ? null : parseInt(parameters.stops.split(/\>|\</)[0])) : parseInt(parameters.stops.split(/\>|\</)[1]);
        if (number == null) {
            errors.push({ message: "Number of stops query *requires* a number." });
        }
        else {
            stops.indexOf('>') > -1 || stops.indexOf('<') > -1 ?
                (stops.indexOf('>') ?
                    query['$expr'] =  { $lt: [{ $size: "$data.bidData.Plan" }, number] } : 
                    query['$expr'] = { $gt: [{ $size: "$data.bidData.Plan" }, number] }
                )
                : query['$expr'] =  { $eq: [{ $size: "$data.bidData.Plan" }, number] } ;
        }
    }
    // filter 2
    if (parameters.bidboard !== undefined) {
        var isbidboard = parameters.bidboard;

        switch( isbidboard ){
            case "true":
                query["data.bidData.isBidActive"] = true;
            break;
            case "false":
                query["data.bidData.isBidActive"] = false;
            break;
            case "":
                errors.push({ message: "Bid board query *requires* a value to check, none provided." });
            break;
            default :
                errors.push({ message: "Bid board query malformed, please use true/false values." });
            break;
        }

    }
    //filter by domain used
    if (parameters.domain !== undefined) {
        var biddomain = parameters.domain;

        if ( biddomain )
        {
            query["domain"] = biddomain;
        }

    }

    //filter by user account used
    if (parameters.account !== undefined) {
        var usernameUsed = parameters.account;

        if ( usernameUsed )
        {
            query["account"] = usernameUsed;
        }

    }
    // filter for date
    /* if (parameters.pickupDate !== undefined) {
        var PickupDate = parameters.pickupDate;

        switch( PickupDate ){
            case PickupDate.indexOf('>') > -1:
                query["data.bidData.isBidActive"] = true;
            break;
            case "false":
                query["data.bidData.isBidActive"] = false;
            break;
            case "":
                errors.push({ message: "Bid board query *requires* a value to check, none provided." });
            break;
            default :
                errors.push({ message: "Bid board query malformed, please use true/false values." });
            break;
        }

    } */
    // sorting
    // have to switch query if the request sort is # of stops
    if (parameters.sort !== undefined) {
        var sortQueryArr = parameters.sort.split(';');

        sortQueryArr.forEach(sortQ => {
            var Query = sortQ.split(',');
            
            var sortName = Query[0];
            var sortOrder = Query[1];
            var sortOperand = '';

            switch (sortOrder){
                case 'asc': case '1':
                    sortOperand = 1;
                break;
                case 'desc': case '-1':
                    sortOperand = -1;
                break;
                default:
                    errors.push({ message: "Sort order (asc,desc) is malformed, please use values like bidboard,asc or stops,-1." });
                break;
            }

            switch (sortName){
                case 'created':
                    sort["date.created"] = sortOperand;
                break;
                case 'id': case '_id':
                    sort["_id"] = sortOperand;
                break;
                case 'oid':
                    sort["oid"] = sortOperand;
                break;
                case 'lastvisibleonbidboard':
                    sort["date.bid.lastvisibleonbidboard"] = sortOperand;
                break;
                case 'bidboard':
                    sort["data.bidData.isBidActive"] = sortOperand;
                break;
                //not sorting correctly
                case 'pickupdate':
                    sort["data.bidData.Plan.PlannedDate.Begin"] = sortOperand;
                break;
                case 'stops':
                    addFields['stopsLength'] = {
                        '$size': "$data.bidData.Plan"
                    };
                    sort['stopsLength'] = sortOperand;
                    switchQuery = true;
                break;
                case 'itemcount':
                    addFields['itemcount'] = {
                        '$size': "$data.bidData.Items"
                    };
                    sort['itemcount'] = sortOperand;
                    switchQuery = true;
                break;
                default:
                    errors.push({ message: "Sort query is malformed, please use values like bidboard,asc or stops,-1." });
                break;
            }
        });
    }
    //debugger;
    return {
        query: query,
        sort: sort,
        errors: errors,
        response: response,
        addFields: addFields,
        switchQuery: switchQuery
    };
}

module.exports = {
    init: async (parameters,socket,io,changeStreamFunc) => {
        socket.data.table = socket.data.table != undefined ? socket.data.table : [];
        /*async function monitorStream(loadboardFunc){
            //
            //  need to stop this from duplicating and instead just start one when the first subscription starts
            //
            const changeStream = Loadboard.watch(pipeline);

            const monitor = async next => {
                console.log("Change happened: ", next);
                switch(next.operationType) {
                    case 'insert':
                        console.log('an insert happened...', "uni_ID: ", next.fullDocument);
                        Loadboard.find(query, {}).limit(limit).sort(sort).then( loadboardFunc ).then( () => io.to(parameters.report).emit("update", response) );
                        break;
                    case 'update':
                        console.log('an update happened...');
                        Loadboard.find(query, {}).limit(limit).sort(sort).then( loadboardFunc ).then( () => io.to(parameters.report).emit("update", response) );
                        break;
                    case 'delete':
                        console.log('a delete happened...');
                        Loadboard.find(query, {}).limit(limit).sort(sort).then( loadboardFunc ).then( () => io.to(parameters.report).emit("update", response) );
                        break;
                    default:
                        break;
                }
                response.query = { query, 'sort': sort };
                response.limit = limit;
                //debugger;
                
                return response;
            };
        
            changeStream.on("change",monitor); 
        }*/
        try{
            var response = {};
            var errors = [];
            var addFields = {};
            var switchQuery = false;
            var t = await formatRequest(parameters,errors,response,addFields,switchQuery);
            var query = t.query;
            var sort = t.sort;
            errors = t.errors,
            response = t.response,
            addFields = t.addFields,
            switchQuery = t.switchQuery;
            //
            //var query = {};
            //var sort = {}
            var limit = 80;
            if ( parameters.limit !== undefined && parseInt(parameters.limit).toString() !== "NaN" )
            {
                limit = parseInt(parameters.limit);
            }
            else if( parameters.limit !== undefined && parseInt(parameters.limit).toString() === "NaN" ){
                errors.push({ message: "Limit value malformed please use numbers only." })
            }

            // Handle standard errors
            if (errors.length == 0) {
                //
                //debugger;
                socket.data.table.push( { currentTable:{
                    query: query,
                    limit: limit,
                    sort: sort,
                    parameters: parameters,
                    switchQuery: switchQuery,
                    reports: response.reports
                }});

                if ( !switchQuery ){
                    //debugger;
                    console.log(nconf.get());

                    const loads = await Loadboard.find(query, { /*_id: 0*/ }).limit(limit).sort(sort).then( (documents)=> {converter.loadboard({documents,response}).then((r) =>{response = r;})} );

                    response.query = { query, 'sort': sort };
                    response.limit = limit;
                    //debugger;
                    //monitorStream(loadboardFunc);
                    return response;
                }
                else{
                    const loads = await Loadboard.aggregate([
                        {
                            $match: query
                        },
                        {
                            $addFields: addFields
                        },
                        {
                            $sort: sort
                        }
                    ]).limit(limit);

                    response.data = loads;
                    response.query = { 'type': 'aggregate', query, 'sort': sort };
                    response['length'] = loads.length;
                    response.limit = limit;
                    response.query = query;
                    //monitorStream();
                    //debugger;
                    return response;
                }
            }
            else {
                response.errors = errors;
                response.query = query;
                //debugger;
                //monitorStream();
                return response;
            }
        } catch (error){
            console.log(error);
        }

    }
}
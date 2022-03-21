const Loadboard = require("../models/loadboard");
const nconf = require('nconf');
const converter = require("../helper/converter");
// load in env to be eventually replaced
nconf.env();

async function monitorStream(io){
    const pipeline = [
        {
            '$match': {
                '$or': [{ 'operationType': 'insert' },{ 'operationType': 'update' }]
            }
        }
    ];
    //debugger;

    const changeStream = Loadboard.watch(pipeline);

    const monitor = async next => {
        console.log("Change happened: ", next);

        var response = {},
        query = nconf.get('currentTable:query'),
        sort = nconf.get('currentTable:sort'),
        limit = nconf.get('currentTable:limit'),
        switchQuery = nconf.get('currentTable:switchQuery'),
        parameters = nconf.get('currentTable:parameters'),
        reports = nconf.get('currentTable:reports'),
        tableConfig = nconf.get('currentTable:tableConfig');

        //debugger;
        switch(next.operationType) {
            case 'insert':
                console.log('an insert happened...', "uni_ID: ", next.fullDocument);
                //Loadboard.find(query, { /*_id: 0*/ }).limit(limit).sort(sort).then( (documents)=> {converter.loadboard({documents,response}).then((r) =>{response = r;response.reports = reports;response.table=tableConfig;})} ).then( () => io.to(parameters.report).emit("update", response) );
                break;
            case 'update':
                console.log('an update happened...');
                //Loadboard.find(query, { /*_id: 0*/ }).limit(limit).sort(sort).then( (documents)=> {converter.loadboard({documents,response}).then((r) =>{response = r;response.reports = reports;response.table=tableConfig;})} ).then( () => io.to(parameters.report).emit("update", response) )
                break;
            case 'delete':
                console.log('a delete happened...');
                //Loadboard.find(query, { /*_id: 0*/ }).limit(limit).sort(sort).then( (documents)=> {converter.loadboard({documents,response}).then((r) =>{response = r;response.reports = reports;response.table=tableConfig;})} ).then( () => io.to(parameters.report).emit("update", response) )
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
}
module.exports = { monitor: monitorStream };
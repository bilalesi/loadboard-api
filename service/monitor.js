//const Loadboard = require("../models/loadboard");
const dashboard_update = require("../models/dashboard_update");
const nconf = require('nconf');
const converter = require("../helper/converter");
// load in env to be eventually replaced
nconf.env();

async function monitorStream(io){
    const pipeline = [
        {
            $match: {
                $expr:[
                        {$or: [
                            { 'operationType': 'insert' }
                        ]}
                ]
            }
        }
    ];
    //debugger;

    const changeStream = dashboard_update.watch({ fullDocument: 'updateLookup' },pipeline);

    const monitor = async next => {
        console.log("Change happened: ", next);

        var response = {};
        /* query = nconf.get('currentTable:query'),
        sort = nconf.get('currentTable:sort'),
        limit = nconf.get('currentTable:limit'),
        switchQuery = nconf.get('currentTable:switchQuery'),
        parameters = nconf.get('currentTable:parameters'),
        reports = nconf.get('currentTable:reports'),
        tableConfig = nconf.get('currentTable:tableConfig'); */

        //debugger;
        io.to('Dashboard').emit('table-update', {next});

        // response.query = { query, 'sort': sort };
        //response.limit = limit;
        //debugger;
        
        return response;
    };

    changeStream.on("change",monitor);
    console.log('watching for changes');
}
module.exports = { monitor: monitorStream };
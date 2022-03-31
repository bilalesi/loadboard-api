//const Loadboard = require("../models/loadboard");
const dashboard_update = require("../models/dashboard_update");
const BidBoardChange = require("../models/BidBoardChange");
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

    const changeStreams = {
        dashboardChangeStream: dashboard_update.watch({ fullDocument: 'updateLookup' },pipeline),
        BidBoardChangeStream: BidBoardChange.watch({ fullDocument: 'updateLookup' },pipeline)
    };

    const dashboardTable_monitor = async next => {
        console.log("Change happened: ", next);
        return await io.to('Dashboard').emit('table-request-update', {next});
    };
    const BidBoardChange_monitor = async next => {
        console.log("Bid Board Change happened: ", next);
        return await io.to('bidBoardChange').emit('bidBoardChange-request-update', {next});
    };

    changeStreams.dashboardChangeStream.on("change",dashboardTable_monitor);
    changeStreams.BidBoardChangeStream.on("change",BidBoardChange_monitor);
    console.log('watching for changes',changeStreams);
}
module.exports = { monitor: monitorStream };
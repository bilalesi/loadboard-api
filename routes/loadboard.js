const express = require("express");
const { route } = require("express/lib/application");
const router = express.Router();
const Loadboard = require("../models/loadboard")


router.post("/", async function (req, res) {
    let data = req.body;
    try {
        const loads = new Loadboard(data)
        const load = await loads.save();
        if (load != null) {
            let io = req.app.get("socketio");
            io.emit("loadAdded", load);
            return res.json(load)
        }

    } catch (error) {
        return res.json({
            status: "403",
            message: error
        })
    }

})
router.get("/getload", async function (req, res) {
    // allow oid or obj _id
    if (req.query['_id'] == null && req.query.id == null && req.query.oid == null) return res.json({ "message": "id/load oid cannot not be null; also please only submit one load." });
    var query = !req.query.id && !req.query._id ? { "oid": parseInt((!req.query.oid ? "0" : req.query.oid)) } : { "_id": (!req.query.id ? req.query['_id'] : req.query.id) };
    try {
        const load = await Loadboard.findOne(query, { _id: 0 });
        return res.json(load);
    } catch (err) {
        return res.json({ status: "403", message: err });
    }
})

// reports
router.get("/getloads", async function (req, res) {
    try {
        var response = {};
        var errors = [];
        var query = {};
        var sort = {}
        //aggregation specific below
        var addFields = {};
        // filter
        if (req.query.stops !== undefined) {
            var stops = req.query.stops;
            var number = !parseInt(req.query.stops.split(/\>|\</)[1]) ? (!parseInt(req.query.stops.split(/\>|\</)[0]) ? null : parseInt(req.query.stops.split(/\>|\</)[0])) : parseInt(req.query.stops.split(/\>|\</)[1]);
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
        if (req.query.bidboard !== undefined) {
            var isbidboard = req.query.bidboard;

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
        if (req.query.domain !== undefined) {
            var biddomain = req.query.domain;

            if ( biddomain )
            {
                query["domain"] = biddomain;
            }

        }
        
        //filter by user account used
        if (req.query.account !== undefined) {
            var usernameUsed = req.query.account;

            if ( usernameUsed )
            {
                query["account"] = usernameUsed;
            }

        }
        // filter for date
        /* if (req.query.pickupDate !== undefined) {
            var PickupDate = req.query.pickupDate;

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

        } */
        // sorting
        // have to switch query if the request sort is # of stops
        var switchQuery = false;
        if (req.query.sort !== undefined) {
            var sortQueryArr = req.query.sort.split(';');

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
                    case 'id':
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



        // Handle standard errors
        if (errors.length == 0) {
            if ( !switchQuery ){
                const loads = await Loadboard.find(query, { _id: 0 }).sort(sort);
                response.data = loads;
                response.query = { query, 'sort': sort };
                response['length'] = loads.length;

                return res.json(response);
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
                ]);

                response.data = loads;
                response.query = { 'type': 'aggregate', query, 'sort': sort };
                response['length'] = loads.length;

                return res.json(response);
            }
        }
        else {
            response.errors = errors;
            return res.json({ status: "403", message: response });
        }

    } catch (error) {
        console.log(error);
        return res.json({ status: "403", message: error.toString() })
    }

});
/* router.get("/activebidboardloads", async function (req, res) {
    try {
        const loads = await Loadboard.find({ 'data.bidData.isBidActive': true }, { _id: 0 })
        return res.json(loads)
    } catch (error) {
        return res.json({ status: "403", message: error })
    }
}) */
//

router.patch("/updateload", async function (req, res) {
    if (req.body == null) return res.json({ message: "request.body cannot be null" });
    try {
        let data = req.body;
        let id = data.id
        delete data.id;

        const load = await Loadboard.findByIdAndUpdate(id, data);
        if (load != null) {
            let io = req.app.get("socketio");
            io.emit("updateload", { _id: id, ...req.body });
            return res.json(load)
        } else {
            return resizeTo.json({ message: "update failed" });
        }
    } catch (err) {
        return res.json({ status: "403", message: err });
    }
});

/*router.delete("/deleteload", async function (req, res) {
    try {
        const load = await Loadboard.findByIdAndDelete(req.body.id)
        if (load != null) {
            let io = req.app.get("socketio");
            io.emit("deleteload", load);
            return res.json(load);
        }

        return res.json({ "message": "load not found" })
    } catch (error) {
        return res.json({ status: "403", "message ": error })
    }
})*/


module.exports = router
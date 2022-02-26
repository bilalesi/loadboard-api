const mongoose = require("mongoose");

const LoadboardSchema = mongoose.Schema({
   _id: mongoose.Schema.Types.ObjectId,
  oid: { type: Number, unique: true },
  data: { type: Object, required: true },
  account: { type: String },
  domain: { type: String },
  date: {
    created: { type: Date },
    bid: {
        lastvisibleonbidboard: { type: Date }
    }
  }
  
});
const mgloads = mongoose.connection.useDb('Integrations');

module.exports = mgloads.model("Loadboard", LoadboardSchema, "MercuryGate");
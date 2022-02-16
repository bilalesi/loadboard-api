const mongoose = require("mongoose");

const LoadboardSchema = mongoose.Schema({
   _id: mongoose.Schema.Types.ObjectId,
  oid: { type: Number, unique: true },
  data: { type: Object, required: true },
  date: {
    created: { type: Date },
    bid: {
        lastvisibleonbidboard: { type: Date }
    }
  }
  
});

module.exports = mongoose.model("Loadboard", LoadboardSchema, "MercuryGate");
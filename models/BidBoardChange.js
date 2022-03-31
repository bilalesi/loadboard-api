let mongoose = require("mongoose");

let SocketIOdbSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  created: { type: Date },
  action: { type: String },
  reason: { type: String },
  newLoads: { type: String },
  loadsChanged: { type: Number }
});
let socketIOdb = mongoose.connection.useDb('SocketIO');

module.exports = socketIOdb.model("BidBoardChange", SocketIOdbSchema, "BidBoardChange");
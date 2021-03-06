let mongoose = require("mongoose");

let SocketIOdbSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  created: { type: Date },
  action: { type: String },
  reason: { type: String },
  loadsChanged: { type: Number },
  newLoads: { type: Array }
});
let socketIOdb = mongoose.connection.useDb('SocketIO');

module.exports = socketIOdb.model("Dashboard_update", SocketIOdbSchema, "Dashboard_update");
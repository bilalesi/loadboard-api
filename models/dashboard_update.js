const mongoose = require("mongoose");

const SocketIOdbSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  created: { type: Date },
  action: { type: String },
  reason: { type: String },
  loadsChanged: { type: Number },
  newLoads: { type: Array }
});
const mgloads = mongoose.connection.useDb('SocketIO');

module.exports = mgloads.model("Dashboard_update", SocketIOdbSchema, "Dashboard_update");
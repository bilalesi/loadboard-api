const mongoose = require("mongoose");

const UIReports = mongoose.Schema({
   _id: mongoose.Schema.Types.ObjectId,
   table: { type: Object },
   name: { type: String }
  
});
const uidb = mongoose.connection.useDb('UI');

module.exports = uidb.model("UI", UIReports, "Reports");
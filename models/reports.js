const mongoose = require("mongoose");

const UIReports = mongoose.Schema({
   _id: mongoose.Schema.Types.ObjectId,
  report: { 
    name: { type: String, unique: true },
    columns: { type: Object }
   }
  
});
const uidb = mongoose.connection.useDb('UI');

module.exports = uidb.model("UI", UIReports, "Reports");
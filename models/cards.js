const mongoose = require("mongoose");

const CardReports = mongoose.Schema({
   _id: mongoose.Schema.Types.ObjectId,
   name: { type: String },
   data: { 
      path: { type: Array }
    }
  
});
const cardReportsDB = mongoose.connection.useDb('UI');

module.exports = cardReportsDB.model("UI", CardReports, "Cards");
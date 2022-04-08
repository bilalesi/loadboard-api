const mongoose = require("mongoose");

const UserAccountModel = mongoose.Schema({
   firstName: { type: String, default: '' },
   lastName: { type: String, default: '' },
   email: { type: String, default: '' },
   oauth: {
       microsoft: {
           id: { type: String, default: '' },
           userPrincipalName: { type: String, default: '' },
           displayName: { type: String, default: '' },
           phone: { type: String, default: '' },
       }
   }
});
const userDB = mongoose.connection.useDb('User');

module.exports = userDB.model("Account", UserAccountModel, "Accounts");
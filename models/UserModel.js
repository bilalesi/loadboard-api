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
UserAccountModel.methods.newToken = function() {
    console.log('newToken', this._id);
    return jwt.sign({ _id: this._id }, jwt_secret, {
      expiresIn: jwt_expiry_time
    });
};
module.exports = userDB.model("Account", UserAccountModel, "Accounts");
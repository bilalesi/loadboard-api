const passport = require("passport");
const UserCollection = require("../models/UserModel");
const MicrosoftStrategy = require("passport-microsoft").Strategy;
const { MICROSOFT_CALLBACK_URL } = require('../constant');

passport.serializeUser((user, done) => done(null, user.id));

// deserialize the cookieUserId to user in the database
passport.deserializeUser((id, done) => {
  UserCollection.findById(id)
    .then((user) => done(null, user))
    .catch((e) => done(new Error("Failed to deserialize an user")));
});
passport.use(
    new MicrosoftStrategy(
      {
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: MICROSOFT_CALLBACK_URL,
        scope: ["user.read"],
      },
      async function (accessToken, refreshToken, profile, done) {
        let user = await UserCollection.findOne({ "oauth.microsoft.id": profile.id });
        console.log('profile --> ', profile);
        if(!user){
          console.log('user not found');
              let newUser = new UserCollection({
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                email: profile.emails[0].value,
                oauth: {
                  microsoft: {
                    id: profile.id,
                    userPrincipalName: profile._json.userPrincipalName,
                    displayName: profile.displayName,
                    phone: profile._json.mobilePhone,
                  },
                },
              });
              newUser.save().then((err, user) => {
                if (err) {
                  return done(err, null);
                }
                return done(null, user);
              });
        } else {
          let userUpdated = await UserCollection.findOneAndUpdate({ "oauth.microsoft.id": profile.id }, {
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value,
            oauth: {
              microsoft: {
                id: profile.id,
                userPrincipalName: profile._json.userPrincipalName,
                displayName: profile.displayName,
                phone: profile._json.mobilePhone,
              },
            },
          }, { new: true });
          console.log('user found', userUpdated);
          return done(null, userUpdated);
        }
      }
    )
  );


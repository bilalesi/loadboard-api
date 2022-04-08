const express = require("express");
const passport = require("passport");


const router = express.Router();

router.get('/microsoft', passport.authenticate('microsoft'));
router.get('/microsoft/callback',
      passport.authenticate('microsoft', {
        successRedirect: `${process.env.FRONTEND_URL}/`,
        failureRedirect: `${process.env.FRONTEND_URL}/login`
      })
);
router.get("/logout", (req, res) => {
  req.logout();
  res.redirect(process.env.FRONTEND_URL);
});



const authCheck = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({
      authenticated: false,
      message: "user has not been authenticated"
    });
  } else {
    next();
  }
};
// if it's already login, send the profile response,
// otherwise, send a 401 response that the user is not authenticated from authCheck
router.get("/check", authCheck, (req, res) => {
  res.status(200).json({
    authenticated: true,
    message: "user successfully authenticated",
    user: req.user,
    cookies: req.cookies
  });
});

module.exports = router;
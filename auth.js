const config = require('./config.js');

const GoogleOAuth2Strategy = require('passport-google-oauth').OAuth2Strategy;
module.exports = (passport) => {
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));
  passport.use(new GoogleOAuth2Strategy(
    {
      clientID: config.oAuthClientID,
      clientSecret: config.oAuthclientSecret,
      callbackURL: config.oAuthCallbackUrl,
    },
    (token, refreshToken, profile, done) => done(null, {profile, token})));
};
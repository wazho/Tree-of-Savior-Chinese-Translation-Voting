/* =============================================
             Facebook authentication
   ============================================= */

// Passport session setup.
passport.serializeUser(function (user, done) {
	done(null, user);
});
passport.deserializeUser(function (obj, done) {
	done(null, obj);
});
// Use the FacebookStrategy within Passport.
passport.use(new FacebookStrategy({
		clientID     : FACEBOOK_APP_ID,
		clientSecret : FACEBOOK_APP_SECRECT,
		callbackURL  : FACEBOOK_CALL_BACK_URL
	}, function (accessToken, refreshToken, profile, done) {
		userControl.findOrCreateUser(profile, function (err, user) {
			if (! err) {
				return done(null, user);
			} else {
				return done(err);
			}
		});
	})
);
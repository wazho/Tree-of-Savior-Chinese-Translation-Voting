/* =============================================
                 Website pages
   ============================================= */

app.get('/', function (req, res) {
	// User checking.
	var user = req.user;
	// Filtering part of conversions to layout.
	var sample = _.sample(_.keys(BASE_DATA), DEFAULT_CONVERSATIONS_PER_PAGE);
	var filter = {};
	_.map(sample, function (code) {
		filter[code] = BASE_DATA[code];
	});
	res.render('index', {
		baseData : filter,
		user     : user
	});
});

// Login via Facebook.
app.get('/login', function (req, res) { res.redirect('/auth/facebook'); });
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));

// Get the conversation detail.
app.get('/conversation/:code', function (req, res) {
	async.waterfall([
		// User checking.
		function (callback) {
			var user = req.user;
			callback(null, user);
		},
		// Get the original conversations.
		function (user, callback) {
			var code = req.params && req.params.code;
			if (code) {
				var conversations = BASE_DATA[code];
				callback(null, user, code, conversations);
			} else {
				callback('ERR_CODE_NOT_EXIST');
			}
		},
		// Get the crowdsourcing translations.
		function (user, code, conversations, callback) {
			var fileSrc = path.normalize(__dirname + '/crowdsourcing/' + code + '.json');
			fs.readFile(fileSrc, 'utf-8', function (err, data) {
				if (! err) {
					eval("var translations = " + data + ";");
					callback(null, user, code, conversations, translations);
				} else {
					callback('ERR_CODE_FILE_NOT_EXIST');
				}
			});
		}
	], function (err, user, code, conversations, translations) {
		if (! err) {
			res.render('detail', {
				user          : user,
				code          : code,
				conversations : conversations,
				translations  : translations
			});
		} else {
			res.send(err);
		}
	});
});
// Create a new translation.
app.post('/conversation/:code/translation', function (req, res) {
	async.waterfall([
		// User checking.
		function (callback) {
			if (req.user) {
				var user = req.user;
				callback(null, user);
			} else {
				callback('ERR_NOT_LOGGED_IN');
			}
		},
		// Get the crowdsourcing translations.
		function (user, callback) {
			var code = req.params && req.params.code;
			if (code) {
				callback(null, user, code);
			} else {
				callback('ERR_CODE_NOT_EXIST');
			}
		},
		// Get the crowdsourcing translations.
		function (user, callback) {
			var translation = req.body && req.body.translation;
			if (translation && translation.match(/^.+$/)) {
				callback(null, user, code, translation);
			} else {
				callback('ERR_CODE_NOT_EXIST');
			}
		},
		// Get the crowdsourcing translations.
		function (user, code, translation, callback) {
			var fileSrc = path.normalize(__dirname + '/crowdsourcing/' + code + '.json');
			fs.readFile(fileSrc, 'utf-8', function (err, data) {
				if (! err) {
					eval("var translations = " + data + ";");
					callback(null, user, code, translation, translations);
				} else {
					callback('ERR_CODE_FILE_NOT_EXIST');
				}
			});
		},
		// Check this user already wrote translation or not.
		function (user, code, translation, translations, callback) {
			console.log(user, code, translation, translations);
			// var fileSrc = path.normalize(__dirname + '/crowdsourcing/' + code + '.json');
			// fs.readFile(fileSrc, 'utf-8', function (err, data) {
			// 	if (! err) {
			// 		eval("var translations = " + data + ";");
			// 		callback(null, code, conversations, translations);
			// 	} else {
			// 		callback('ERR_CODE_FILE_NOT_EXIST');
			// 	}
			// });
		}
	], function (err, code, conversations, translations) {
		if (! err) {
			res.render('detail', {
				code          : code,
				conversations : conversations,
				translations  : translations
			});
		} else {
			res.send(err);
		}
	});
});

// 404 page redirect.
app.use(function (req, res) {
	res.status(400).redirect('/');
});

var server = app.listen(3000);

/* =============================================
               Find or create user
   ============================================= */

function User() {}

var userControl = new User();

User.prototype.findOrCreateUser = function (profile, callback) {
	if (! profile) {
		return callback('ERR_PROFILE');
	}
	var user = {
		id          : profile.id,
		name        : profile.displayName,
		gender      : profile.gender,
		create_time : moment().format('YYYY-MM-DD HH:mm:ss')
	};
	var userDest = __dirname + '/users/' + user.id + '.json';
	fs.exists(userDest, function (exists) {
		if (! exists) {
			fs.writeFile(userDest, JSON.stringify(user), 'utf8', function (err) {});
		}
	});
	callback(null, user);
};
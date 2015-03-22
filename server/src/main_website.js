/* =============================================
                 Website pages
   ============================================= */

app.get('/', function (req, res) {
	async.waterfall([
		// User checking.
		function (callback) {
			var user = (req.user) ? req.user : 'GUEST';
			callback(null, user);
		},
		// Filtering part of conversions to layout.
		function (user, callback) {
			// var sample = _.sample(_.keys(BASE_DATA), DEFAULT_CONVERSATIONS_PER_PAGE);
			var sample = ['QUEST_LV_0100_20150312_001086', 'ETC_20150312_001769', 'QUEST_LV_0100_20150312_001494']; // This line is assigned to test.
			var filters = {};
			_.map(sample, function (code) {
				filters[code] = {};
				filters[code].originals = BASE_DATA[code];
			});
			callback(null, user, filters);
		},
		// Each conversation of filters need get own top 3 translations.
		function (user, filters, callback) {
			async.map(_.pairs(filters), function (filter, callback) {
				var code         = filter[0],
					conversation = filter[1];
				var fileSrc = path.normalize(__dirname + '/crowdsourcing/' + code + '.json');
				fs.readFile(fileSrc, 'utf-8', function (err, data) {
					if (! err) {
						eval("var translations = " + data + ";");
						// Sort by assentient counts descending then choose top 3 assentient translations.
						translations = _.sortBy(translations, function (translation) {
							return (translation.assentients) ? (- translation.assentients.length) : 0;
						});
						var top3Translations = [translations[0] || {}, translations[1] || {}, translations[2] || {}];
						filters[code].translations = top3Translations;
						callback(null);
					} else {
						callback('ERR_CODE_FILE_NOT_EXIST');
					}
				});
			}, function (err) {
				if (! err) {
					callback(null, user, filters);
				} else {
					callback(err);
				}
			});
		}
	], function (err, user, filters) {
		res.render('index', {
			user     : user,
			baseData : filters
		});	
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
			var user = (req.user) ? req.user : 'GUEST';
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
					// Sort by assentient counts descending.
					translations = _.sortBy(_.pairs(translations), function (translation) {
						return (translation[1].assentients) ? (- translation[1].assentients.length) : 0;
					});
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
		function (user, code, callback) {
			var translation = req.body && req.body.translation;
			if (translation && translation.match(/^.+$/)) {
				callback(null, user, code, translation);
			} else {
				callback('ERR_FORM_TRANSLATION');
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
			// Have not sumbit the conversation of this code.
			if (! translations[user.id]) {
				translations[user.id] = {
					conversation : translation,
					assentients  : [],
					submit_time  : moment().format('YYYY-MM-DD HH:mm:ss')
				};
				var crowdsourcingDest = __dirname + '/crowdsourcing/' + code + '.json';
				fs.writeFile(crowdsourcingDest, JSON.stringify(translations), 'utf8', function (err) {
					if (! err) {
						callback('TEMP');
					} else {
						callback('ERR_WRITE_TRANSLATATION_FAIL');
					}
				});
			} else {
				callback('ERR_EVER_TRANSLATED');
			}
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
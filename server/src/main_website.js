/* =============================================
                 Website pages
   ============================================= */

app.get('/', function (req, res) {
	async.waterfall([
		// User checking.
		function (callback) {
			var user = (req.user) ? req.user : 'GUEST';
			callback(null, user);
		}
	], function (err, user, filters) {
		res.render('index', {
			user     : user || {},
			baseData : filters || {},
			files    : TSV_FILES
		});	
	});
});

// Login via Facebook.
app.get('/login', function (req, res) { res.redirect('/auth/facebook'); });
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));

// 
app.get('/sample/:sample/filter/:filter/file/:file', function (req, res) {
	async.waterfall([
		// Get the paramaters.
		function (callback) {
			var params = req.params;
			if (params.sample === undefined || ! params.sample.match(/^SAMPLE_.+$/)) {
				callback('ERR_PARAMS_SAMPLE');
			} else if (params.filter === undefined || ! params.filter.match(/^FILTER_.+$/)) {
				callback('ERR_PARAMS_FILTER');
			} else if (params.file === undefined || ! params.file.match(/^FILE_.+$/)) {
				callback('ERR_PARAMS_FILE');
			} else {
				callback(null, params);
			}
		},
		// Filtering part of conversions to layout.
		function (params, callback) {
			var sample;
			console.log(BASE_DATA);
			// File.
			if (params.file === 'FILE_ALL') {
				sample = _.keys(BASE_DATA);
			} else {
				;
			}
			// Filter.
			if (params.filter === 'FILTER_ALL') {
				sample = sample;
			} else {
				;
			}
			// Sample.
			if (params.sample === 'SAMPLE_RANDOM') {
				sample = _.sample(sample, DEFAULT_CONVERSATIONS_PER_PAGE);
			} else {
				;
			}
			// var sample = _.sample(_.keys(BASE_DATA), DEFAULT_CONVERSATIONS_PER_PAGE);
			// // var sample = _.sortBy(_.keys(BASE_DATA)).slice(1011, 1019);
			// // var sample = ['QUEST_LV_0100_20150312_001086', 'ETC_20150312_001769', 'QUEST_LV_0100_20150312_001494']; // This line is assigned to test.
			var conversations = {};
			_.map(sample, function (code) {
				conversations[code] = { originals : BASE_DATA[code] };
			});
			callback(null, conversations);
		},
		// Each conversation of conversations need get own top 3 translations.
		function (conversations, callback) {
			async.map(_.pairs(conversations), function (conversationPair, callback) {
				var code         = conversationPair[0],
					conversation = conversationPair[1];
				var fileSrc = path.normalize(__dirname + '/crowdsourcing/' + code + '.json');
				fs.readFile(fileSrc, 'utf-8', function (err, data) {
					if (err) {
						callback('ERR_CODE_FILE_NOT_EXIST');
					} else {
						eval("var translations = " + data + ";");
						// Sort by assentient counts descending.
						translations = {
							// Unsorting.
							_json  : translations,
							// Sorting.
							_array : _.sortBy(_.pairs(translations), function (translation) {
								return (translation[1].assentients) ? (- translation[1].assentients.length) : 0;
							})
						};
						conversations[code].translations = [translations._array[0] || [], translations._array[1] || [], translations._array[2] || []];
						callback(null);
					}
				});
			}, function (err) {
				if (! err) {
					callback(null, conversations);
				} else {
					callback(err);
				}
			});
		}
	], function (err, conversations) {
		res.render('table', {
			baseData : conversations || {}
		});	
	});
});

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
					translations = {
						// Unsorting.
						_json  : translations,
						// Sorting.
						_array : _.sortBy(_.pairs(translations), function (translation) {
							return (translation[1].assentients) ? (- translation[1].assentients.length) : 0;
						})
					};
					callback(null, user, code, conversations, translations);
				} else {
					callback('ERR_CODE_FILE_NOT_EXIST');
				}
			});
		},
		// Add the attribute about liked translation.
		function (user, code, conversations, translations, callback) {
			_.map(translations._array, function (translation) {
				translation[1].liked = (_.indexOf(translation[1].assentients, user.id) === -1) ? false : true;
			});
			callback(null, user, code, conversations, translations);
		},
		// Check user had translated or not.
		function (user, code, conversations, translations, callback) {
			if (translations._json[user.id]) {
				callback(null, user, code, conversations, translations._array, true);
			} else {
				callback(null, user, code, conversations, translations._array, false);
			}
		}
	], function (err, user, code, conversations, translations, translated) {
		if (! err) {
			res.render('detail', {
				user           : user,
				code           : code,
				conversations  : conversations,
				translations   : translations,
				everTranslated : translated
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
		// Check the params.
		function (user, callback) {
			var code = req.params && req.params.code;
			if (code) {
				callback(null, user, code);
			} else {
				callback('ERR_CODE_NOT_EXIST');
			}
		},
		// Check the submitted form.
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
				// Write the JSON file.
				var crowdsourcingDestination = __dirname + '/crowdsourcing/' + code + '.json';
				fs.writeFile(crowdsourcingDestination, JSON.stringify(translations), 'utf8', function (err) {
					if (! err) {
						callback(null, code);
					} else {
						callback('ERR_WRITE_TRANSLATATION_FAIL');
					}
				});
			} else {
				callback('ERR_EVER_TRANSLATED');
			}
		}
	], function (err, code) {
		if (! err) {
			res.send('SUCCESS');
		} else {
			res.send(err);
		}
	});
});
// Like a translation.
app.put('/conversation/:code/translation/:translator/like', function (req, res) {
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
		// Check the params.
		function (user, callback) {
			var code       = req.params && req.params.code,
				translator = req.params && req.params.translator;
			if (code && translator) {
				callback(null, user, code, translator);
			} else if (! code) {
				callback('ERR_CODE_NOT_EXIST');
			} else {
				callback('ERR_TRANSLATOR_NOT_EXIST');
			}
		},
		// Get the crowdsourcing translations.
		function (user, code, translator, callback) {
			var fileSrc = path.normalize(__dirname + '/crowdsourcing/' + code + '.json');
			fs.readFile(fileSrc, 'utf-8', function (err, data) {
				if (! err) {
					eval("var translations = " + data + ";");
					callback(null, user, code, translator, translations);
				} else {
					callback('ERR_CODE_FILE_NOT_EXIST');
				}
			});
		},
		// Like the translation into assentients.
		function (user, code, translator, translations, callback) {
			// Have not sumbit the conversation of this code.
			if (translations[translator]) {
				if (_.indexOf(translations[translator].assentients, user.id) === -1) {
					translations[translator].assentients.push(user.id);
					// Write the JSON file.
					var crowdsourcingDestination = __dirname + '/crowdsourcing/' + code + '.json';
					fs.writeFile(crowdsourcingDestination, JSON.stringify(translations), 'utf8', function (err) {
						if (! err) {
							callback(null, code);
						} else {
							callback('ERR_WRITE_TRANSLATATION_FAIL');
						}
					});
				} else {
					callback('ERR_EVER_LIKED_TRANSATION');
				}
			} else {
				callback('ERR_TRANSLATOR_NOT_EXIST');
			}
		}
	], function (err, code) {
		if (! err) {
			res.send('SUCCESS');
		} else {
			res.send(err);
		}
	});
});

// 404 page redirect.
app.use(function (req, res) {
	res.status(400).redirect('/');
});

var server = app.listen(LISTENING_PORT);

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
	// Create the folder.
	var usersPath = __dirname + '/users/';
	fs.exists(usersPath, function (exists) {
		if (! exists) fs.mkdirSync(crowdsourcingPath);
	});
	// Write the JSON file.
	var usersDestination = usersPath + user.id + '.json';
	fs.exists(usersDestination, function (exists) {
		if (! exists) fs.writeFile(usersDestination, JSON.stringify(user), 'utf8', function (err) {});
	});
	callback(null, user);
};
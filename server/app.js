/*

 ____        _                        _            
/ ___|  __ _| |_ __ ___   ___  _ __  | |___      __
\___ \ / _` | | '_ ` _ \ / _ \| '_ \ | __\ \ /\ / /
 ___) | (_| | | | | | | | (_) | | | || |_ \ V  V / 
|____/ \__,_|_|_| |_| |_|\___/|_| |_(_)__| \_/\_/  

	Author: Ze-Hao, Wang (Salmon)
	GitHub: http://github.com/grass0916
	Site:   http://salmon.tw

	Copyright 2015 Salmon
	Released under the MIT license

*/

/* =============================================
                    Packages
   ============================================= */

// Below is native libraries.
var readline = require('readline'),
	path     = require('path'),
	url      = require('url'),
	fs       = require('fs');
// Below is 3rd-party libraries.
var async            = require('async'),
	_                = require('underscore'),
	request          = require('request'),
	express          = require('express'),
	session          = require('express-session'),
	cookieParser     = require('cookie-parser'),
	bodyParser       = require('body-parser'),
	jade             = require('jade'),
	moment           = require('moment'),
	passport         = require('passport'),
	FacebookStrategy = require('passport-facebook').Strategy;
var app              = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'Salmon', key: 'Salmon'}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/public', express.static(__dirname + '/public'));

/* =============================================
                Global variables
   ============================================= */

// Parsing the original datasets.
var AUTO_REFRESH_ORIGINAL_TSV = false;
var BASE_DATA = {};
var TSV_SOURCE = 'https://raw.githubusercontent.com/Treeofsavior/EnglishTranslation/master/';
var TSV_FILES  = { /* TSV_FILES cannot have any '.' (dot) in the part of key, please careful */
	'ETC' : {
		'KR' : 'ETC.tsv',
		'EN' : 'ETC_en.tsv',
	},
	'QUEST_LV_0100' : {
		'KR' : 'QUEST_LV_0100.tsv',
		'EN' : 'QUEST_LV_0100_en.tsv',
	},
};

// Facebook app.
var FACEBOOK_APP_ID        = '1810718309152618';
var FACEBOOK_APP_SECRECT   = '784fbb1f0a480cac854f79a39e3617d9';
var FACEBOOK_CALL_BACK_URL = 'http://140.109.16.10:3000/auth/facebook/callback';

// Client end.
var DEFAULT_CONVERSATIONS_PER_PAGE = 5;

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
	console.log(user);
	res.render('index', {
		baseData : filter,
		user     : user
	});
});
// Login via Facebook.
app.get('/login', function (req, res) {
	res.redirect('/auth/facebook');
});
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
	successRedirect: '/', failureRedirect: '/login'
}));
// 404 page redirect.
app.use(function (req, res) {
	res.status(400).redirect('/');
});

var server = app.listen(3000);

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

/* =============================================
          Generate Translate Base Data
   ============================================= */

var generateTranslateBaseData = function () {
	async.map(_.keys(TSV_FILES), function (series, callback) {
		async.map(_.keys(TSV_FILES[series]), function (language, callback) {
			async.waterfall([
				// Parsing the HTML.
				function (callback) {
					var url = TSV_SOURCE + TSV_FILES[series][language];
					request(url, function (err, res, body) {
						if (! err && res.statusCode === 200) {
							// console.log("[Success] Parsing the HTML (" + url + ").");
							callback(null, body);
						} else {
							callback(err);
						}
					});
				},
				// Writing the .TSV file.
				function (body, callback) {
					var dest = __dirname + '/original_tsv/' + TSV_FILES[series][language];
					fs.writeFile(dest, body, 'utf8', function (err) {
						if (! err) {
							// console.log("[Success] Writing " + TSV_FILES[series][language] + " file.");
							callback(null);
						} else {
							callback(err);
						}
					});
				},
				// Split the string in '\n', then split each row in '\r'.
				function (callback) {
					var dest = __dirname + '/original_tsv/' + TSV_FILES[series][language];
					fs.readFile(dest, 'utf8', function (err, data) {
						var conversations = {};
						if (! err) {
							var lines = data.toString().split('\n').map(function (line) {
								var line = line.split('\t');
								if (line[0] && line[0] !== '') {
									conversations[line[0]] = line[1];
								}
							});
							callback(null, language, conversations);
						} else {
							callback(err);
						}
					});
				}
			], function (err, language, conversations) {
				if (! err) {
					var tsv = {
						language      : language,
						conversations : conversations
					}
					callback(null, tsv);
				} else {
					callback(err);
				}
			});
		}, function (err, tsvs) {
			var baseData = {};
			tsvs.map(function (tsv) {
				_.mapObject(tsv.conversations, function (conversation, code) {
					baseData[code] = baseData[code] || {};
					baseData[code][tsv.language] = conversation;
				});
			});
			callback(err, baseData);
		});
	}, function (err, baseDatum) {
		baseDatum.map(function (baseData) {
			_.mapObject(baseData, function (language, code) {
				var destA = __dirname + '/generation_json/' + code + '.json';
				fs.writeFile(destA, JSON.stringify(language), 'utf8', function (err) {});
				var destB = __dirname + '/crowdsourcing/' + code + '.json';
				fs.exists(destB, function (exists) {
					if (! exists) {
						fs.writeFile(destB, JSON.stringify("{}"), 'utf8', function (err) {});
					}
				});
			});
		});
	});
}

/* =============================================
          Generate Translate Base Data
   ============================================= */

var readTranslateBaseData = function () {
	// Get the files in article directory.
	fs.readdir(__dirname + '/generation_json/', function (err, files) {
		var jsonCache = new Array();
		async.map(files, function (file, callback) {
			// Check the Ext.name.
			if (path.extname(file) === '.json') {
				// Eval the json files in folder 'generation_json'.
				var fileSrc = path.normalize(__dirname + '/generation_json/' + file);
				fs.readFile(fileSrc, 'utf-8', function (err, data) {
					eval("BASE_DATA['" + path.basename(file, '.json') + "']=" + data);
					callback(null);
				});
			} else {
				callback(null);
			}
		}, function (err) {
			console.log("The generated files has loaded completely.");
		});
	});
}

/* =============================================
              Initial for Base Data
   ============================================= */

if (AUTO_REFRESH_ORIGINAL_TSV) {
	generateTranslateBaseData();
	readTranslateBaseData();
} else {
	readTranslateBaseData();
}

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
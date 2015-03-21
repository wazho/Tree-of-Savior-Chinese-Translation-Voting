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

// Below is native library.
var readline = require('readline');
var path     = require('path');
var url      = require('url');
var fs       = require('fs');
// Below is 3rd-party library.
var async    = require('async');
var _        = require('underscore');
var request  = require('request');
var express  = require('express');
var jade     = require('jade');
var app      = express();

/* =============================================
                Global variables
   ============================================= */

var AUTO_REFRESH_ORIGINAL_TSV = false;

var TSV_SOURCE = 'https://raw.githubusercontent.com/Treeofsavior/EnglishTranslation/master/';

/* TSV_FILES cannot have any '.' (dot) in the part of key, please careful */
var TSV_FILES  = {
	'ETC' : {
		'KR' : 'ETC.tsv',
		'EN' : 'ETC_en.tsv',
	},
	'QUEST_LV_0100' : {
		'KR' : 'QUEST_LV_0100.tsv',
		'EN' : 'QUEST_LV_0100_en.tsv',
	},
};

var BASE_DATA = {};

/* =============================================
                 Website pages
   ============================================= */

app.use('/public', express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.locals.basedir = app.get('views');
app.set('view engine', 'jade');

app.get('/', function (req, res) {
	var sample = _.sample(_.keys(BASE_DATA), 5);
	var filter = {};
	_.map(sample, function (code) {
		filter[code] = BASE_DATA[code];
	});
	res.render('index', {
		baseData : filter
	});
});

var server = app.listen(3000);

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
				})
			});
		});
	});
};

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
};	

/* =============================================
              Initial for Base Data
   ============================================= */

if (AUTO_REFRESH_ORIGINAL_TSV) {
	generateTranslateBaseData();
	readTranslateBaseData();
} else {
	readTranslateBaseData();
}
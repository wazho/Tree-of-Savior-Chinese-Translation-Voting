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
						fs.writeFile(destB, JSON.stringify({}), 'utf8', function (err) {});
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
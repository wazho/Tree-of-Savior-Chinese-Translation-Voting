/* =============================================
          Generate Translate Base Data
   ============================================= */

var generateTranslateBaseData = function () {
	// Create the folder.
	var originalTsvPath    = __dirname + '/original_tsv/',
		crowdsourcingPath  = __dirname + '/crowdsourcing/',
		generationJsonPath = __dirname + '/generation_json/';
	fs.exists(originalTsvPath, function (exists) {
		if (! exists) fs.mkdir(originalTsvPath);
	});
	fs.exists(crowdsourcingPath, function (exists) {
		if (! exists) fs.mkdir(crowdsourcingPath);
	});
	fs.exists(generationJsonPath, function (exists) {
		if (! exists) fs.mkdir(generationJsonPath);
	});
	// Async.
	async.map(_.keys(TSV_FILES), function (series, callback) {
		async.map(_.keys(TSV_FILES[series]), function (language, callback) {
			async.waterfall([
				// Parsing the HTML.
				function (callback) {
					if (AUTO_REFRESH_ORIGINAL_TSV) {
						var url = TSV_SOURCE + TSV_FILES[series][language];
						request(url, function (err, res, body) {
							if (! err) {
								callback(null, body);
							} else {
								callback(err);
							}
						});
					} else {
						callback(null, []);
					}
				},
				// Writing the .TSV file.
				function (body, callback) {
					if (AUTO_REFRESH_ORIGINAL_TSV) {
						var dest = originalTsvPath + TSV_FILES[series][language];
						fs.writeFile(dest, body, 'utf8', function (err) {
							if (! err) {
								console.log("[Success] Writing " + TSV_FILES[series][language] + " file.");
								callback(null);
							} else {
								callback(err);
							}
						});
					} else {
						callback(null);
					}
				},
				// Split the string in '\n', then split each row in '\r'.
				function (callback) {
					var dest = originalTsvPath + TSV_FILES[series][language];
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
				(err) ? callback(err) : callback(null, { language : language, conversations : conversations });
			});
		}, function (err, tsvs) {
			var baseDatum = {};
			_.map(tsvs, function (tsv) {
				_.mapObject(tsv.conversations, function (conversation, code) {
					baseDatum[code] = baseDatum[code] || {};
					baseDatum[code][tsv.language] = conversation;
				});
			});
			_.map(baseDatum, function (language, code) {
				var fileDestinationA = generationJsonPath + code + '.json';
				fs.writeFile(fileDestinationA, JSON.stringify(language), 'utf8', function (err) {});
				var fileDestinationB = crowdsourcingPath + code + '.json';
				fs.exists(fileDestinationB, function (exists) {
					if (! exists) fs.writeFile(fileDestinationB, JSON.stringify({}), 'utf8', function (err) {});
				});
			});
			callback(err);
		});
	}, function (err) {
		console.log("[Success] Refresh the files of generation JSON.");
		setTimeout(readTranslateBaseData, 2000);
	});
}

/* =============================================
          Generate Translate Base Data
   ============================================= */

var readTranslateBaseData = function () {
	// Get the files in article directory.
	fs.readdir(__dirname + '/generation_json/', function (err, files) {
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
			console.log("[Success] Load the files of generation JSON completely.");
		});
	});
}

/* =============================================
              Initial for Base Data
   ============================================= */

generateTranslateBaseData();
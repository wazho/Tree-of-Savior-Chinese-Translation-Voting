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
	Released under the MIT license (only code part, not include images)

*/

/* =============================================
                    Packages
   ============================================= */

// Below is native libraries.
var readline = require('readline'),
	path     = require('path'),
	url      = require('url');
// Below is 3rd-party libraries.
var async            = require('async'),
	_                = require('underscore'),
	fs               = require('graceful-fs'),
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

/* Global variables for setting environment */
eval(fs.readFileSync(__dirname + '/src/_config.js', 'utf8'));
/* Base data parsing from ToS's GitHub document */
eval(fs.readFileSync(__dirname + '/src/base_data_parser.js', 'utf8'));
/* Facebook login authentication */
eval(fs.readFileSync(__dirname + '/src/fb_authentication.js', 'utf8'));
/* Express build website application */
eval(fs.readFileSync(__dirname + '/src/main_website.js', 'utf8'));
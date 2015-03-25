/* =============================================
                Global variables
   ============================================= */

// Parsing the original datasets auto.
// Be careful this variable. Official will put down the completed translation file.
var AUTO_REFRESH_ORIGINAL_TSV = false;
var BASE_DATA = {};
var TSV_SOURCE = 'https://raw.githubusercontent.com/Treeofsavior/EnglishTranslation/master/';
var TSV_FILES  = {
	// TSV_FILES cannot have any '.' (dot) in the part of key, please careful.
	'ETC' : {
		'KR' : 'ETC.tsv',						// Last update. 2015/03/20 22:56
		'EN' : 'ETC_en.tsv',					// Last update. 2015/03/20 22:55
	},
	'QUEST_LV_0100' : {
		'KR' : 'QUEST_LV_0100.tsv',				// Last update. 2015/03/20 22:47
		'EN' : 'QUEST_LV_0100_en.tsv',			// Last update. 2015/03/20 22:46
	},
	// Terms : These are a special part that allow the official's request.
	// 'TERMS_CLASS' : {
	// 	'' : 'wd'
	// }
};

// Domain name and listening port.
var DOMAIN_NAME    = 'localhost';
var LISTENING_PORT = 3000;

// Facebook app.
var FACEBOOK_APP_ID        = '1810718309152618';
var FACEBOOK_APP_SECRECT   = '784fbb1f0a480cac854f79a39e3617d9';
var FACEBOOK_CALL_BACK_URL = 'http://' + DOMAIN_NAME + ':' + LISTENING_PORT + '/auth/facebook/callback';

// Client end.
var DEFAULT_CONVERSATIONS_PER_PAGE = 5;
/* =============================================
                Global variables
   ============================================= */

// Parsing the original datasets auto.
// Be careful this variable. Official will put down the completed translation file.
var AUTO_REFRESH_ORIGINAL_TSV    = false;
var AUTO_REFRESH_GENERATION_JSON = false;
var BASE_DATA = {};
var TSV_SOURCE = 'https://raw.githubusercontent.com/Treeofsavior/EnglishTranslation/master/';
var TSV_FILES  = {
	// TSV_FILES cannot have any '.' (dot) in the part of key, please careful.
	'ETC' : {
		'KR' : 'ETC.tsv',						// Last update.
		'EN' : 'ETC_en.tsv',					// Last update.
	},
	'QUEST_LV_0100' : {
		'KR' : 'QUEST_LV_0100.tsv',				// Last update.
		'EN' : 'QUEST_LV_0100_en.tsv',			// Last update.
	},
	'QUEST_LV_0200' : {
		'KR' : 'QUEST_LV_0200.tsv',				// Last update. 
		'EN' : 'QUEST_LV_0200_en.tsv',			// Last update. 
	},
	'ITEM' : {
		'KR' : 'ITEM.tsv',						// Last update. 
		'EN' : 'ITEM_en.tsv',					// Last update. 
	},
	'SKILL' : {
		'KR' : 'SKILL.tsv',						// Last update. 
		'EN' : 'SKILL_en.tsv',					// Last update. 
	},
	
	// Terms : These are a special part that allow the official's request.
	// 'TERMS_CLASS' : {
	// 	'' : ''
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
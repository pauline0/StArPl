// generelle JS-Funktionen, die nicht seitenspeziefisch sind
// muss zwangsläufig vor der seitenzugehörigen .js-Datei eingebunden werden

// GET-Paras
function getGetParas()
{
	var n=window.location.search.substring(1).split("&");
	if(n.length)
	{
		for(var t={},e=0;e<n.length;e++)
		{
			var a=n[e].split("=");
			t[unescape(a[0])]=unescape(a[1])
		}
		window.$_GET=function(n)
		{
			return n?t[n]:t
		}
	}
}

// window.$_GET = function(param){
// 		if (last_query_str === undefined || last_query_str != window.location.search){
//
// 		}
// }

var menu = {
	init : function(user_role){
	}
}

var user = {
	currentId : null,
	currentRole : null,
	current:null,

	getCurrent: function(){
		var data =
		{
			action: "getOwnUser"
		}
		$.ajaxSetup({async: false});
		$.post(settings.phpBackend, data)
		.always(function(data)
		{
			if (data.length > 0)
				user.current = data[0];
		});
		$.ajaxSetup({async: true});
	},

	logout: function(){

	}

}

function htmlEncode(value){
	// return $('<div/>').text(value).html();
	if (!value) return " "
	return value.
	replace(/&/g, '&amp;').
	replace( /([^\#-~| |!])/g, function(value) {
		return '&#' + value.charCodeAt(0) + ';';
	}).
	replace(/</g, '&lt;').
	replace(/>/g, '&gt;');
}

var settings = {
 	detailTableColumns :
	[
		['title', 'Titel'],
		['student', 'Student'],
		['fb', 'Studiengang'],
		['language', 'Sprache'],
		['type', 'Art der Arbeit'],
		['year', 'Jahrgang'],
		['docent', 'Betreuer'],
		['company', 'Firma'],
		['abstract', 'Kurzfassung']
	],

	viewAllTableColumns : [
		//Name des Attributs, Tabellen Header Name, Funktion zum Rendern
		['title', 'Titel', (arbeit) => { return '<a onclick="showDocument(' + arbeit.id + ');">' + htmlEncode(arbeit.title) + '</a>' }],
		['student', 'Student', null],
		['fb', 'Studiengang', null],
		['language', 'Sprache', null],
		['type', 'Art der Arbeit', null],
		['year', 'Jahrgang', null],
		['docent', 'Betreuer', null],
		['company', "Firma", 	(arbeit) => {return htmlEncode(arbeit.company) + '<span class="hidden">' + ((arbeit.searchWords) ? htmlEncode(arbeit.searchWords.join(" ")) : "") + "</span>"}]
	],

	select : {
		fb : [
	   "Bank",
	   "Bauwesen",
	   "Dienstleistungsmanagement",
	   "Elektrotechnik",
	   "Facility Management",
	   "Handel",
	   "IBA",
	   "Immobilienwirtschaft",
	   "Industrie",
	   "Informatik",
	   "Maschinenbau",
	   "PPM",
	   "Spedition/Logistik",
	   "Steuern/Prüfungswesen",
	   "Tourismusbetriebswirtschaft",
			"Versicherung",
		  "Wirtschaftsinformatik"
		],

		language :[
			"deutsch",
			"englisch"
		],

		type : [
			"Praxistransferbericht",
			"Studienarbeit",
			"Bachelorarbeit"
		]
	},

	iconFilePdf: "img/pdf.png",
	phpBackend: "php/manageBackend.php",

	text: {
		searchwords:"Schlagworte"
	},
	errors: {
		duplicateSearchword:"Dieses Dokument hat schon dieses Schlagwort."
	}


}

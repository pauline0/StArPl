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

function logout(){
//	$("#logoutButton").click();
	var logoutData = new FormData();
	logoutData.append("logout", "")
	$.ajaxSetup({
	    data : logoutData,
	    processData: false,
	    contentType: false,
			async:false
	});
	$.post("index.php",function(){
		studiengang = location.search.match(/studiengang=[\w|%]+/)
		if (studiengang){
			location.href = "?" + studiengang[0];
		}
		else {
			location.href = ""
		}
	});
}

var menu = {

	init : function(user_role){
		if (user_role !== undefined)
		{
			$(".nav_ur").each(function(i, e){
				e = $(e);
				(e.data("role") <= user_role) ? e.show() : e.hide()
			})
			$('#loginLink').hide();
		}
		else
		{
			$(".nav_ur").hide();
			$('#loginLink').show();
		}
	}
}

var user = {
	currentId : null,
	currentRole : null,
	name:null,
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

var settings = {
 	detailTableColumns :
	[
		['titel', 'Titel'],
		['student', 'Student'],
		['studiengang', 'Studiengang'],
		['language', 'Sprache'],
		['artOfArbeit', 'Art der Arbeit'],
		['jahrgang', 'Jahrgang'],
		['betreuer', 'Betreuer'],
		['firma', 'Firma'],
		['kurzfassung', 'Kurzfassung']
	],

	viewAllTableColumns : [
		//Name des Attributs, Tabellen Header Name, Funktion zum Rendern
		['titel', 'Titel', (arbeit) => { return '<a onclick="showArbeitDetailled(' + arbeit.Id + ');">' + arbeit.titel + '</a>' }],
		['student', 'Student', null],
		['studiengang', 'Studiengang', null],
		['language', 'Sprache', null],
		['artOfArbeit', 'Art der Arbeit', null],
		['jahrgang', 'Jahrgang', null],
		['betreuer', 'Betreuer', null],
		['firma', "Firma", 	(arbeit) => {return arbeit.firma + '<span class="hidden">' + arbeit.searchWords.join(" ") + "</span>"}]
	],

	select : {
		studiengang : [
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

		sprache :[
			"deutsch",
			"englisch"
		],

		typ : [
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

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
	phpBackend: "php/manageBackend.php"

}

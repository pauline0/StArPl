// globale Variablen
var arrayAllArbeiten = null;
var arrayIdsArbeiten = null;
var arraySelectedArbeiten = null;
var arrayTableSelectedArbeiten = null;
var arrayAllSearchWordsWithId = null;
var ownUser = null;
var arrayTableDetailledView =
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
];


$(document).ready(function() {
	// Navigation zwischen den Fachbereichen
	getAllArbeiten();
	getGetParas();
	prepareTableHeader();
	getOwnUser();
	if ($_GET().edit)
	{
		$('#tableBodyDetailledArbeitEdit').hide();
	}
	if (ownUser[0].Id)
	{
		$('#divLogoutButton').show();
		$('#divLoginButton').hide();
	}
	else
	{
		$('#divLogoutButton').hide();
		$('#divLoginButton').show();
	}
	$('#tableOverview').DataTable
	(
		{
			"language":
			{
				"url": "js/dataTableGerman.json"
			}
		}
	);
	if ($_GET().id)
	{
		if($_GET().hidden){
			showHiddenArbeit($_GET().id)
		}
		else{
			showArbeitDetailled($_GET().id);
		}
	}
	else
	{
		changeFachbereich($_GET().studiengang);
	}
	$('.nav.nav-pills.nav-stacked li')
	.click
	(
		function()
		{
			changeFachbereich($(this)[0].innerText);//value);
		}
	);
});

// erstellt den tableHeader
function prepareTableHeader()
{
	var strHtml =
		'<tr>' +
			'<th>Titel</th>' +
			'<th>Student</th>' +
			'<th>Studiengang</th>' +
			'<th>Sprache</th>' +
			'<th>Art der Arbeit</th>' +
			'<th>Jahrgang</th>' +
			'<th>Betreuer</th>' +
			'<th>Firma</th>';
	if ($_GET().edit)
	{
		strHtml += '<th><span class="glyphicon glyphicon-pencil"></span></th>';
	}
	strHtml += '</tr>';
	$('#tableHeader')[0].innerHTML = strHtml;
}

// update der DataTable
function reloadDataTable()
{
	arrayTableSelectedArbeiten = new Array();
	for (var key in arraySelectedArbeiten)
	{
		var arrayOneRow = new Array();
		arrayOneRow.push('<a onclick="showArbeitDetailled(' + arraySelectedArbeiten[key].Id + ');">' + arraySelectedArbeiten[key].titel + '</a>');
		arrayOneRow.push(arraySelectedArbeiten[key].student);
		arrayOneRow.push(arraySelectedArbeiten[key].studiengang);
		arrayOneRow.push(arraySelectedArbeiten[key].language);
		arrayOneRow.push(arraySelectedArbeiten[key].artOfArbeit);
		arrayOneRow.push(arraySelectedArbeiten[key].jahrgang);
		arrayOneRow.push(arraySelectedArbeiten[key].betreuer);
		// für die Suche - nicht elegant, aber effektiv ;)
		var strHtml =
			arraySelectedArbeiten[key].firma +
			'<span class="hidden">';
		for (var schlagwort in arraySelectedArbeiten[key].searchWords)
		{
			strHtml += arraySelectedArbeiten[key].searchWords[schlagwort];
		}
		strHtml += '</span>';
		arrayOneRow.push(strHtml);
		if ($_GET().edit)
		{
			if (ownUser[0].Id == arraySelectedArbeiten[key].userId || ownUser[0].UserRole == '1') // verfügt der User über Bearbeitungsrecht?
			{
				arrayOneRow.push('<a onclick="showArbeitDetailled(' + arraySelectedArbeiten[key].Id + ');"><span class="glyphicon glyphicon-pencil"></span></a>');
			}
			else
			{
				arrayOneRow.push('');
			}
		}
		arrayTableSelectedArbeiten.push(arrayOneRow);
	}
	$('#tableOverview').DataTable().clear();
	$('#tableOverview').DataTable().rows.add(arrayTableSelectedArbeiten);
	$('#tableOverview').DataTable().draw();
}

// lädt alle Arbeiten aus der Datenbank
function getAllArbeiten()
{
	arrayIdsArbeiten = new Array();
	var data =
	{
		action: "getAllArbeiten"
	}
	$.ajaxSetup({async: false});
	$.post("php/manageBackend.php", data)
	.always(function(data)
	{
		arrayAllArbeiten = data;
		for (var key in arrayAllArbeiten)
		{
			arrayIdsArbeiten.push(arrayAllArbeiten[key].Id);
		}
	});
	$.ajaxSetup({async: true});
	getAllSearchWordsWithId();
}

// gibt alle Schlagwörter aus
function getAllSearchWordsWithId()
{
	arrayAllSearchWordsWithId = new Array();
	var data =
	{
		action: "getAllSearchWordsWithId"
	}
	$.ajaxSetup({async: false});
	$.post("php/manageBackend.php", data)
	.always(function(data)
	{
		arrayAllSearchWordsWithId = data;
		for (var keyArbeiten in arrayAllArbeiten)
		{
			var idArray = $.inArray(keyArbeiten.toString(), arrayIdsArbeiten);
			var arraySearchWords = new Array();
			for (var keySearch in arrayAllSearchWordsWithId)
			{
				if (arrayAllSearchWordsWithId[keySearch].FileId == arrayAllArbeiten[keyArbeiten].Id.toString())
				{
					arraySearchWords.push(arrayAllSearchWordsWithId[keySearch].Word);
				}
			}
			arrayAllArbeiten[keyArbeiten]['searchWords'] = arraySearchWords;
		}
	});
	$.ajaxSetup({async: true});
}

// wird beim Wechsel des Fachbereichs Aufgerufen
function changeFachbereich(selectedStudiengang)
{
	arraySelectedArbeiten = new Array();
	selectedStudiengang = selectedStudiengang || '';
	for (var key in arrayAllArbeiten)
	{
		if (arrayAllArbeiten[key].studiengang == selectedStudiengang || '' == selectedStudiengang || undefined == selectedStudiengang)
		{
			arraySelectedArbeiten.push(arrayAllArbeiten[key]);
		}
	}
	$('#headLineStudiengang')[0].innerHTML = selectedStudiengang;
	$('#divTableOverview').show();
	$('#tableDetailledArbeit').hide();
	reloadDataTable();
	if ($_GET().edit)
	{
		window.history.replaceState('', '', '?edit&studiengang=' + selectedStudiengang);
	}
	else
	{
		window.history.replaceState('', '', '?studiengang=' + selectedStudiengang);
	}
	resetArbeit();
	$('#editButtons').hide();
	$('#leaveButtons').hide();
}

function getArbeitTableHTML(selectedArbeit){
	var strHtml = '';
	for (var subArray in arrayTableDetailledView)
	{
		strHtml +=
			'<tr>' +
				'<th>' + arrayTableDetailledView[subArray][1] + '</th>' +
				'<td>' + selectedArbeit[arrayTableDetailledView[subArray][0]] + '</td>' +
			'</tr>';
	}
	if (ownUser[0].UserRole == 1 || ownUser[0].Id == selectedArbeit.userId)
	{
		strHtml +=
			'<tr>' +
				'<th>Downloads</th>' +
				'<td id="downloadsValue">' + selectedArbeit.downloads + '</td>' +
			'</tr>';
	}
	strHtml +=
			'<tr>' +
				'<th>Datei(en)</th>' +
				'<td>';
					for (var file in selectedArbeit.dateien)
					{
						var selectedFile = selectedArbeit.dateien[file];
						strHtml += '<a target="_blank" href="upload/' + selectedArbeit.Id + '/' + selectedFile + '" onclick="downloadFile(' + selectedArbeit.Id + ');">';
						if (selectedFile.substr(selectedFile.length - 4, 4) == '.pdf')
						{
							strHtml += '<img src="img/pdf.png">';
						}
						strHtml += selectedFile + '</a><br/>';
					}
	strHtml +=
				'</td>' +
			'</tr>';
	return strHtml;
}


// detaillierte Übersicht über eine Arbeit
function showArbeitDetailled(Id)
{
	console.log(Id);
	var idArray = $.inArray(Id.toString(), arrayIdsArbeiten);
	var selectedArbeit = arrayAllArbeiten[idArray];
	if (selectedArbeit != undefined)
	{
		$('#tableBodyDetailledArbeit')[0].innerHTML = getArbeitTableHTML(selectedArbeit);
		$('#headLineStudiengang')[0].innerHTML = '<a onclick="changeFachbereich(\'' + selectedArbeit.studiengang + '\');">' + selectedArbeit.studiengang + '</a> > ' + selectedArbeit.titel;
		$('#divTableOverview').hide();
		$('#tableDetailledArbeit').show();
		if ($_GET().edit)
		{
			window.history.replaceState('', '', '?edit&studiengang=' + selectedArbeit.studiengang + '&id=' + selectedArbeit.Id);
			if (ownUser[0].Id == selectedArbeit.userId || ownUser[0].UserRole == '1')
			{
				$('#editButtons').show();
			}
			else
			{
				$('#editButtons').hide();
			}
			$('#leaveButtons').hide();
		}
		else
		{
			$('#leaveButtons').hide();
			$('#editButtons').hide();
			window.history.replaceState('', '', '?studiengang=' + selectedArbeit.studiengang + '&id=' + selectedArbeit.Id);
		}
	}
	else
	{
		changeFachbereich();
	}
}

function showHiddenArbeit(id){
	arrayIdsArbeiten = new Array();
	var hiddenArbeit;
	var data =
	{
		action: "getPrivateArbeit",
		id: id
	}
	$.ajaxSetup({async: false});
	$.post("php/manageBackend.php", data)
	.always(function(data)
	{
		console.log(data);
		if (data[0] > 0 ){
			hiddenArbeit = data[1];
		}
		else{
			changeFachbereich();
		}
	});
	$.ajaxSetup({async: true});
	if (hiddenArbeit){
		$('#tableBodyDetailledArbeit')[0].innerHTML = getArbeitTableHTML(hiddenArbeit);
		$('#divTableOverview').hide();
		$('#tableDetailledArbeit').show();
		if (data[0] == 2){
			$('#buttonPublishDoc').removeClass("hidden");
		}
	}
}

function releaseDocument(id){
	var data =
	{
		action: "releasePrivateDocument",
		id: id
	}
	$.ajaxSetup({async: false});
	$.post("php/manageBackend.php", data)
	.always(function(data)
	{
		console.log(data);
	});
}

// zählt den Counter für Downloads hoch
function downloadFile(Id)
{
	var data =
	{
		action: 'incrementDownloads',
		id: Id
	}
	$.ajaxSetup({async: false});
	$.post("php/manageBackend.php", data)
	.always(function(data)
	{
		var idArray = $.inArray(Id.toString(), arrayIdsArbeiten);
		arrayAllArbeiten[idArray].downloads = parseInt(arrayAllArbeiten[idArray].downloads)
		arrayAllArbeiten[idArray].downloads += 1;
		$('#downloadsValue')[0].innerHTML = arrayAllArbeiten[idArray].downloads;
	});
	$.ajaxSetup({async: true});
}

// ============================================================
// ausschließlich für den edit-Bereich erforderlich / sinnvoll
// ============================================================

// eigener User
function getOwnUser()
{
	var data =
	{
		action: "getOwnUser"
	}
	$.ajaxSetup({async: false});
	$.post("php/manageBackend.php", data)
	.always(function(data)
	{
		ownUser = data;
	});
	$.ajaxSetup({async: true});
}

// wechselt in den Bearbeitungsmodus
function editArbeit()
{
	getGetParas();
	var idArray = $.inArray($_GET().id.toString(), arrayIdsArbeiten);
	var selectedArbeit = arrayAllArbeiten[idArray];
	var cuttedArrayTableDetailledView = arrayTableDetailledView.slice(0, -1);
	var arrayTableEdit =
	[
		'<input class="form-control" id ="' + arrayTableDetailledView[0][0] + '" name="' + arrayTableDetailledView[0][0] + '" value="' + selectedArbeit[arrayTableDetailledView[0][0]] + '" required />',
		'<input class="form-control" id ="' + arrayTableDetailledView[1][0] + '" name="' + arrayTableDetailledView[1][0] + '" value="' + selectedArbeit[arrayTableDetailledView[1][0]] + '" required />',
		'<select class="form-control" id="studiengang" name="studiengang" required>' +
			'<option value="Bank">Bank</option>' +
			'<option value="Bauwesen">Bauwesen</option>' +
			'<option value="Dienstleistungsmanagement">Dienstleistungsmanagement</option>' +
			'<option value="Elektrotechnik">Elektrotechnik</option>' +
			'<option value="Facility Management">Facility Management</option>' +
			'<option value="Handel">Handel</option>' +
			'<option value="IBA">IBA</option>' +
			'<option value="Immobilienwirtschaft">Immobilienwirtschaft</option>' +
			'<option value="Industrie">Industrie</option>' +
			'<option value="Informatik">Informatik</option>' +
			'<option value="Maschinenbau">Maschinenbau</option>' +
			'<option value="PPM">PPM</option>' +
			'<option value="Spedition/Logistik">Spedition/Logistik</option>' +
			'<option value="Steuern/Prüfungswesen">Steuern/Prüfungswesen</option>' +
			'<option value="Tourismusbetriebswirtschaft">Tourismusbetriebswirtschaft</option>' +
			'<option value="Versicherung">Versicherung</option>' +
			'<option value="Wirtschaftsinformatik">Wirtschaftsinformatik</option>' +
		'</select>',
		'<select class="form-control" id="language" name="language" required>' +
			'<option value="deutsch">deutsch</option>' +
			'<option value="englisch">englisch</option>' +
		'</select>',

		'<select class="form-control" id="artOfArbeit" name="artOfArbeit" required>' +
			'<option value="Praxistransferbericht">Praxistransferbericht</option>' +
			'<option value="Studienarbeit">Studienarbeit</option>' +
			'<option value="Bachelorarbeit">Bachelorarbeit</option>' +
		'</select>',
		'<input class="form-control" id ="' + arrayTableDetailledView[5][0] + '" name="' + arrayTableDetailledView[5][0] + '" value="' + selectedArbeit[arrayTableDetailledView[5][0]] + '" required pattern="[0-9]{4}" />',
		'<input class="form-control" id ="' + arrayTableDetailledView[6][0] + '" name="' + arrayTableDetailledView[6][0] + '" value="' + selectedArbeit[arrayTableDetailledView[6][0]] + '" required />',
		'<input class="form-control" id ="' + arrayTableDetailledView[7][0] + '" name="' + arrayTableDetailledView[7][0] + '" value="' + selectedArbeit[arrayTableDetailledView[7][0]] + '" required />'
	]
	var strHtml = '';
	for (var subArray in cuttedArrayTableDetailledView)
	{
		strHtml +=
			'<tr>' +
				'<th>' + cuttedArrayTableDetailledView[subArray][1] + '</th>' +
				'<td>' + arrayTableEdit[subArray] + '</td>' +
			'</tr>';
	}
	strHtml +=
		'<tr>' +
			'<th>' + arrayTableDetailledView[arrayTableDetailledView.length - 1][1] + '</th>' +
			'<td><textarea class="form-control" rows="5" id ="' + arrayTableDetailledView[arrayTableDetailledView.length - 1][0] + '" name="' + arrayTableDetailledView[arrayTableDetailledView.length - 1][0] +'" required>' + selectedArbeit[arrayTableDetailledView[arrayTableDetailledView.length - 1][0]] + '</textarea></td>' +
		'</tr>';
	strHtml += '<tr> <th> Schlagwörter </th> <td> <div id="searchWords"> searchWords </div>';
	strHtml += '<div id="add" class="form-inline"><span class="input-group-btn"><input class="form-control" id="schlagwort" placeholder="Neues Schlagwort" list="schlagwoerter" />' +
		'<button type="button" class="btn btn-success addButton" onclick="addSW();"><i class="glyphicon glyphicon-plus"></i></button></span> </div> </td> </tr>'

	/*strHtml +=
		'<tr>' +
			'<th>Datei(en)</th>' +
			'<td>';
				for (var file in selectedArbeit.dateien)
				{
					var selectedFile = selectedArbeit.dateien[file];
					strHtml += '<a target="_blank" href="upload/' + selectedArbeit.Id+ '/' + selectedFile + '">';
					if (selectedFile.substr(selectedFile.length - 4, 4) == '.pdf')
					{
						strHtml += '<img src="img/pdf.png">';
					}
					strHtml += selectedFile + '</a><br/>';
				}
	strHtml +=
			'</td>' +
		'</tr>';*/
	$('#tableBodyDetailledArbeitEdit')[0].innerHTML = strHtml;
	$('#studiengang')[0].value = selectedArbeit[arrayTableDetailledView[2][0]];
	$('#language')[0].value = selectedArbeit[arrayTableDetailledView[3][0]];
	$('#artOfArbeit')[0].value = selectedArbeit[arrayTableDetailledView[4][0]];
	$('#tableBodyDetailledArbeit').hide();
	$('#tableBodyDetailledArbeitEdit').show();
	$('#editButtons').hide();
	$('#leaveButtons').show();
	fillSearchwords($_GET().id);
}

// verlässt den Bearbeitungsmodus
function resetArbeit()
{
	$('#tableBodyDetailledArbeit').show();
	$('#tableBodyDetailledArbeitEdit').hide();
	$('#editButtons').show();
	$('#leaveButtons').hide();
	return false;
}

function fillSearchwords(docId){
	var data =
	{
		action: 'getAllSearchWordsForDocument',
		id: docId
	}
	$.ajaxSetup({async: false});
	$.post("php/manageBackend.php", data)
	.always(function(r_data)
	{
		console.log(r_data);
		displaySearchWords(r_data);
	});
	$.ajaxSetup({async: true});
}

function getSWListItem(text){
	return "<li class='list-group-item' id='sw_"+ text +"'>" + text + '<span class="glyphicon glyphicon-trash" onclick="deleteSW($(this))"></span></li>'
}

function displaySearchWords(searchWords){
	var searchwordStr = "<ul class='list-group'>";
	for (var i = 0; i < searchWords.length; i++){
		searchwordStr += getSWListItem(searchWords[i]);
	}
	$("#searchWords").html(searchwordStr + "</ul>");
}

function removeDeleteRequest(swElement){
	//remove class delete
	console.log(swElement);
	swElement.parent().removeClass("delSW");
	//add Button for delete Request
	swElement.parent().html(swElement.parent().text() + '<span class="glyphicon glyphicon-trash" onclick="deleteSW($(this))"></span>');

}

function deleteSW(delButton){
	//add Class to SW element to be deleted
	swElement = delButton.parent();
	console.log(swElement);
	swElement.addClass("delSW");
	//add Button to remove Deleterequest
	//Button: Tooltip: UNDO, removes deleteClass from swElement
	swElement.html(getSWdeleteText(swElement.text()));

}
function getSWdeleteText(text){
	return text + '<span class="glyphicon glyphicon-trash " onclick="removeDeleteRequest($(this))"></span>';
}
function getSWaddString(text){
	return "<li id='sw_"+ text +"' class='list-group-item addSW'>" + text + '<span class="glyphicon glyphicon-trash" onclick="removeNewSearchword($(this))"></span></li>';
}

function addSW(){
	var text = $("#schlagwort")[0].value;
	//check if searchword already exists for this document
	if (text === ""){
		return;
	}
	var swExists = ($("#searchWords li").toArray().some(elem => elem.innerText === text));//.length > 0
	if (!swExists){
		var newSwElem = getSWaddString(text);
		$("#searchWords ul").append(newSwElem);
		$("#schlagwort")[0].value = "";
	}
	else{
		alert("Dieses Dokument hat schon dieses Schlagwort.")
	}
}

function removeNewSearchword(elem){
	elem[0].parentNode.remove();
}

// speichert die Arbeit
function saveArbeit()
{
	getGetParas();
	var addSW = [];
	var delSW = [];
	$("li.addSW").each(function (idx,elem){
		addSW.push(elem.textContent);
	});
	$("li.delSW").each(function (idx, elem){
		delSW.push(elem.textContent);
	});
	var data = $('#formSaveArbeit').serialize();
	data += '&action=formSaveArbeit&id=' + $_GET().id +"&deleteSW="+JSON.stringify(delSW)+"&addSW="+JSON.stringify(addSW);
	$.ajaxSetup({async: false});
	$.post("php/manageBackend.php", data);
	$.ajaxSetup({async: true});
	resetArbeit();
	getAllArbeiten();
	getOwnUser();
	showArbeitDetailled($_GET().id);
	arraySearchwordOperations = [];
	return false;
}

// löscht eine Arbeit vollständig
function deleteArbeit()
{
	if (confirm('Möchten Sie diese Arbeit wirklich löschen?'))
	{
		getGetParas();
		var idArray = $.inArray($_GET().id.toString(), arrayIdsArbeiten);
		var id = arrayAllArbeiten[idArray].Id;
		var data =
		{
			action: "deleteArbeit",
			id: id
		}
		$.ajaxSetup({async: false});
		$.post("php/manageBackend.php", data)
		.always(function(data)
		{
			// console.log(data);
			// Achtung, Fake-Meldung
			/*if(true)
			{*/
				alert('Der Bericht wurde erfolgreich gelöscht.');
			/*}
			else // NICHT erfolgreich gelöscht
			{
				alert('Der Bericht konnte nicht gelöscht werden.');
			}*/
			getAllArbeiten();
			getOwnUser();
			changeFachbereich();
		});
		$.ajaxSetup({async: true});
	}
}

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
		$('#divLogoutButton').show();
	}
	else
	{
		$('#divLogoutButton').hide();
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
		showArbeitDetailled($_GET().id);
	}
	else
	{
		changeFachbereich($_GET().studiengang);
	}
	$('button.btn.btn-default.btn-sm.btn-block')
	.click
	(
		function()
		{
			changeFachbereich($(this)[0].value);
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

// detaillierte Übersicht über eine Arbeit
function showArbeitDetailled(Id)
{
	var idArray = $.inArray(Id.toString(), arrayIdsArbeiten);
	var selectedArbeit = arrayAllArbeiten[idArray];
	if (selectedArbeit != undefined)
	{
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
							strHtml += '<a target="_blank" href="upload/' + selectedArbeit.Id + '/' + selectedFile + '" onclick="downloadFile(' + Id + ');">';
							if (selectedFile.substr(selectedFile.length - 4, 4) == '.pdf')
							{
								strHtml += '<img src="img/pdf.png">';
							}
							strHtml += selectedFile + '</a><br/>';
						}
		strHtml +=
					'</td>' +
				'</tr>';
		$('#tableBodyDetailledArbeit')[0].innerHTML = strHtml;
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

// speichert die Arbeit
function saveArbeit()
{
	getGetParas();
	var data = $('#formSaveArbeit').serialize();
	data += '&action=formSaveArbeit&id=' + $_GET().id;
	$.ajaxSetup({async: false});
	$.post("php/manageBackend.php", data);
	$.ajaxSetup({async: true});
	resetArbeit();
	getAllArbeiten();
	getOwnUser();
	showArbeitDetailled($_GET().id);
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
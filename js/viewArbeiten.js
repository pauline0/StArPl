// globale Variablen
var arrayAllArbeiten = null;
var arrayIdsArbeiten = null;
var arraySelectedArbeiten = null;
var arrayTableSelectedArbeiten = null;
var arrayAllSearchWordsWithId = null;
var ownUser = null;

$(document).ready(function() {
	// Navigation zwischen den Fachbereichen
	getAllArbeiten();
	getGetParas();
	prepareTableHeader();
	if ($_GET().edit)
	{
		getOwnUser();
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
			if (ownUser[0].Id == arraySelectedArbeiten[key].userId || ownUser[0].UserRole == '1') // handelt es sich um einen eigenen Bericht
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
}

// detaillierte Übersicht über eine Arbeit
function showArbeitDetailled(Id)
{
	var idArray = $.inArray(Id.toString(), arrayIdsArbeiten);
	var selectedArbeit = arrayAllArbeiten[idArray];
	if (selectedArbeit != undefined)
	{
		var tableSortArray =
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
		var strHtml = '';
		for (var subArray in tableSortArray)
		{
			strHtml +=
				'<tr>' +
					'<th>' + tableSortArray[subArray][1] + '</th>' +
					'<td>' + selectedArbeit[tableSortArray[subArray][0]] + '</td>' +
				'</tr>';
		}
		strHtml +=
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
				'</tr>';
		$('#tableBodyDetailledArbeit')[0].innerHTML = strHtml;
		$('#headLineStudiengang')[0].innerHTML = '<a onclick="changeFachbereich(\'' + selectedArbeit.studiengang + '\');">' + selectedArbeit.studiengang + '</a> > ' + selectedArbeit.titel;
		$('#divTableOverview').hide();
		$('#tableDetailledArbeit').show();
		if ($_GET().edit)
		{
			window.history.replaceState('', '', '?edit&studiengang=' + selectedArbeit.studiengang + '&id=' + selectedArbeit.Id);
		}
		else
		{
			window.history.replaceState('', '', '?studiengang=' + selectedArbeit.studiengang + '&id=' + selectedArbeit.Id);
		}
	}
	else
	{
		changeFachbereich();
	}
}

// ==================================================
// ausschließlich für den edit-Bereich erforderlich
// ==================================================

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
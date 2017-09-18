// globale Variablen
var arrayAllArbeiten = null;
var arrayIdsArbeiten = new Array();

$(document).ready(function() {
	// Navigation zwischen den Fachbereichen
	getAllArbeiten();
	getGetParas();
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

// lädt alle Arbeiten aus der Datenbank
function getAllArbeiten()
{
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
}

// wird beim Wechsel des Fachbereichs Aufgerufen
function changeFachbereich(selectedStudiengang)
{
	var strHtml = '';
	selectedStudiengang = selectedStudiengang || '';
	for (var key in arrayAllArbeiten)
	{
		if (arrayAllArbeiten[key].studiengang == selectedStudiengang || '' == selectedStudiengang || undefined == selectedStudiengang)
		{
			strHtml +=
				'<tr>' +
					'<td><a onclick="showArbeitDetailled(' + arrayAllArbeiten[key].Id + ');">' + arrayAllArbeiten[key].titel + '</a></td>' +
					'<td>' + arrayAllArbeiten[key].student + '</td>' +
					'<td>' + arrayAllArbeiten[key].studiengang + '</td>' +
					'<td>' + arrayAllArbeiten[key].language + '</td>' +
					'<td>' + arrayAllArbeiten[key].artOfArbeit + '</td>' +
					'<td>' + arrayAllArbeiten[key].jahrgang + '</td>' +
					'<td>' + arrayAllArbeiten[key].dozent + '</td>' +
					'<td>' + arrayAllArbeiten[key].firma + '</td>' +
				'</tr>'
		}
	}
	$('#tableContent')[0].innerHTML = strHtml;
	$('#headLineStudiengang')[0].innerHTML = selectedStudiengang;
	$('#tableOverview').show();
	window.history.replaceState('', '', '?studiengang=' + selectedStudiengang);
}

function showArbeitDetailled(Id)
{
	var idArray = $.inArray(Id.toString(), arrayIdsArbeiten);
	var selectedArbeit = arrayAllArbeiten[idArray];
	try
	{
		$('#headLineStudiengang')[0].innerHTML = '<a onclick="changeFachbereich(\'' + selectedArbeit.studiengang + '\');">' + selectedArbeit.studiengang + '</a> > ' + selectedArbeit.titel;
		$('#tableOverview').hide();
		window.history.replaceState('', '', '?studiengang=' + selectedArbeit.studiengang + '&id=' + selectedArbeit.Id);
	}
	catch(e)
	{
		changeFachbereich();
	}
}
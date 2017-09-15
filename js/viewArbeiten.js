// globale Variablen
var arrayAllArbeiten = null;

$(document).ready(function() {
	// Navigation zwischen den Fachbereichen
	getAllArbeiten();
	changeFachbereich();
	$('button.btn.btn-default.btn-sm.btn-block').click(changeFachbereich);
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
	});
	$.ajaxSetup({async: true});
}

// wird beim Wechsel des Fachbereichs Aufgerufen
function changeFachbereich()
{
	var strHtml = '';
	var selectedStudiengang = '';
	if ($(this)[0].value)
	{
		selectedStudiengang = $(this)[0].value;
	}
	for (var key in arrayAllArbeiten)
	{
		if (arrayAllArbeiten[key].studiengang == selectedStudiengang || '' == selectedStudiengang)
		{
			strHtml +=
				'<td>' + arrayAllArbeiten[key].titel + '</td>' +
				'<td>' + arrayAllArbeiten[key].student + '</td>' +
				'<td>' + arrayAllArbeiten[key].studiengang + '</td>' +
				'<td>' + arrayAllArbeiten[key].language + '</td>' +
				'<td>' + arrayAllArbeiten[key].artOfArbeit + '</td>' +
				'<td>' + arrayAllArbeiten[key].jahrgang + '</td>' +
				'<td>' + arrayAllArbeiten[key].dozent + '</td>' +
				'<td>' + arrayAllArbeiten[key].firma + '</td>'
		}
	}
	$('#tableContent')[0].innerHTML = strHtml;
}
$(document).ready(function() {
	// Navigation zwischen den Fachbereichen
	$('button.btn.btn-default.btn-sm.btn-block').click(changeFachbereich);
});

// wird beim Wechsel des Fachbereichs Aufgerufen
function changeFachbereich()
{
	strHtml = '';
	strHtml += $(this).text();
	$('#contentOverview')[0].innerHTML = strHtml;
}
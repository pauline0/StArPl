$(document).ready(function() {
	$('button.btn.btn-default.btn-sm.btn-block').click(changeFachbereich);
});

// wird beim Wechsel des Fachbereichs Aufgerufen
function changeFachbereich()
{
	strHtml = '';
	strHtml += $(this).text();
	$('#contentOverview')[0].innerHTML = strHtml;
}

// wird beim hochladen aufgerufen
function upload()
{
	return false;
}

// wird beim Login aufgerufen
function login()
{
	if (false)
	{
		// Login erfolgreich
		$('#formLogin-divError').addClass('hide');
	}
	else
	{
		// Login fehlgeschlagen
		$('#formLogin-divError').removeClass('hide');
		if (false)
		{
			$('#formLogin-divError')[0].innerHTML = '<b>Login fehlgeschlagen!</b> Falscher Username oder Passwort.';
		}
		else
		{
		$('#formLogin-divError')[0].innerHTML = '<b>Fehler!</b> Datenbank ist nicht erreichbar.';
		}
	}
	return false;
}
$(document).ready(function() {
	getGetParas();
	initializeForm();
});

// initialisiert das Formular (richtige ZielPage)
function initializeForm()
{
	if ($_GET().upload)
	{
		document.formLogin.action = './?upload';
	}
	else if ($_GET().edit)
	{
		document.formLogin.action = './?edit';
	}
}

// wird beim Login aufgerufen
function login()
{
	var returnValue = false;
	var data = $('#formLogin').serialize();
	data += '&action=formLogin';
	$.ajaxSetup({async: false});
	$.post("php/manageBackend.php", data)
	.always(function(data)
	{
		if (data[0] >= 1) // data[0] entspricht UserId
		{
			// Login erfolgreich
			$('#formLogin-divError').addClass('hide');
			returnValue = true;
		}
		else
		{
			// Login fehlgeschlagen
			$('#formLogin-divError').removeClass('hide');
			if (data[0] == 0) // login Fehlgeschlagen
			{
				$('#formLogin-divError')[0].innerHTML = '<b>Login fehlgeschlagen!</b> Falscher Username oder Passwort.';
			}
			else
			{
				$('#formLogin-divError')[0].innerHTML = '<b>Fehler!</b> Datenbank ist nicht erreichbar.';
			}
		}
	});
	$.ajaxSetup({async: true});
	return returnValue;
}
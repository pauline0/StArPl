$(document).ready(function() {
	getGetParas();
	initializeForm();
	$('#formLogin-divError').hide();
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
	// data += '&action=formLogin';
	data += '&action=loginHwr';
	$.ajaxSetup({async: false});
	$.post("php/manageBackend.php", data)
	/*.always(function(data)
	{
		if (data[0] >= 1) // data[0] entspricht UserId
		{
			// Login erfolgreich
			$('#formLogin-divError').hide();
			returnValue = true;
		}
		else
		{
			// Login fehlgeschlagen
			$('#formLogin-divError').show();
			if (data[0] == 0) // login Fehlgeschlagen
			{
				$('#formLogin-divError')[0].innerHTML = '<b>Login fehlgeschlagen!</b> Falscher Username oder Passwort.';
			}
			else
			{
				$('#formLogin-divError')[0].innerHTML = '<b>Fehler!</b> Datenbank ist nicht erreichbar.';
			}
		}
	});*/
	.always(function(data)
	{
		// console.log(data);
		// if (data.session)
		if (data[0] >= 1)
		{
			$('#formLogin-divError').hide();
			// Backend-Arbeit (user in tabelle erstellen mit dummy-PW (wegen admin-acc wird PW-Spalte benötigt), falls nicht vorhanden)
			// in $_SESSION anzeigenamen speichern
			returnValue = true;
		}
		else
		{
			$('#formLogin-divError').show();
			$('#formLogin-divError')[0].innerHTML = '<b>Login fehlgeschlagen!</b> Falscher Username oder Passwort.';
		}
	});
	$.ajaxSetup({async: true});
	return returnValue;
}
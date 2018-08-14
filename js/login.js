$(document).ready(function() {
	getGetParas();
	initializeForm();
	// $('#formLogin-divError').hide();
	menu.init();
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
	data += '&action=loginHwr';
	$.ajaxSetup({async: false});
	$.post("php/manageBackend.php", data)
	.always(function(data)
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
				$('#formLogin-divError')[0].innerHTML = '<b>Login fehlgeschlagen!</b> ' + data[1];
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

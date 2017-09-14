// wird beim Login aufgerufen
function login()
{
	var returnValue = false;
	var UserName = $('#UserName')[0].value;
	var Password = $('#Password')[0].value;
	$.ajaxSetup({async: false});
	var data =
	{
		action: "login",
		UserName: UserName,
		Password: Password
	}
	$.post("php/manageBackend.php", data)
	.always(function(data)
	{
		// console.log(data);
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
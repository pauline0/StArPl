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

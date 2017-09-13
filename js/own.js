$(document).ready(function() {
	// Navigation zwischen den Fachbereichen
	$('button.btn.btn-default.btn-sm.btn-block').click(changeFachbereich);
	
	// FileUploadArbeit
	$("#FileInputUploadArbeit").fileinput({
        showUpload: false, // Zeile 698 in "fileinput.js" bearbeitet, showUpload auf false gesetzt; Zeile 3.930 in "fileinput.js" bearbeitet, um "Remove"-Button rot einzufärben
		uploadUrl: 'upload',
		allowedFileTypes: ['pdf'],
        overwriteInitial: true,
		defaultPreviewContent: '<i class="glyphicon glyphicon-file" style="font-size:100px;"></i><h6 class="text-muted">Laden Sie Ihre Arbeit hier hoch (.pdf-Format), unterstützt Drag & Drop</h6>'
    });
	
	// Schlagwörter
    var maxSchlagwoerter = 10; // wie viele Inputs?
    $('#formUpload')
	.on('click', '.addButton', function() {
		var $template = $('#missingTemplate');
		var $clone = $template
			.clone()
			.removeClass('hide')
			.removeAttr('id')
			.children().children('input').attr('required', true).parents().parents() // notwenig wegen required
			.insertBefore($template);
		var $schlagwort = $clone.find('[name="schlagwort[]"]');
		if ($('#formUpload').find(':visible[name="schlagwort[]"]').length >= maxSchlagwoerter)
		{
			$('#formUpload').find('.addButton').attr('disabled', 'disabled');
		}
	})
	.on('click', '.removeButton', function() {
		var $row    = $(this).parents('.form-group');
		var $schlagwort = $row.find('[name="schlagwort[]"]');
		$row.remove();
		if ($('#formUpload').find(':visible[name="schlagwort[]"]').length < maxSchlagwoerter)
		{
			$('#formUpload').find('.addButton').removeAttr('disabled');
		}
	});
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
	var returnValue = false;
	var data = $('#formUpload').serialize();
	data += '&action=formUpload';
	$.ajaxSetup({async: false});
	$.post("php/manageBackend.php", data)
	.always(function(data)
	{
		// console.log(data);
		if (data[0] != 0)
		{
			returnValue = true;
			$('#idOfFile')[0].value = data[0];
		}
	});
	$.ajaxSetup({async: true});
	return returnValue;
}

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
		console.log(data);
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
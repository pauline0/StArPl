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
	return true;
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
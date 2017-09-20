$(document).ready(function() {
	// FileUploadArbeit
	$("#FileInputUploadArbeit").fileinput({
        showUpload: false, // Zeile 701 in "fileinput.js" bearbeitet, showUpload auf false gesetzt; Zeile 3.939 in "fileinput.js" bearbeitet, um "Remove"-Button rot einzufärben
		allowedFileTypes: ['pdf'],
        overwriteInitial: true,
		browseClass: "btn btn-primary",
        browseLabel: "&nbsp;Datei(en) auswählen [*.pdf]",
		browseIcon: "<i class=\"glyphicon glyphicon-folder-open\"></i>",
        removeLabel: "&nbsp;Löschen"
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

	// Schlagwörter-datalist füllen
	fillDataListSchlagwoerter();
});

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

// befüllt die Schlagwörter-datalist 
function fillDataListSchlagwoerter()
{
	var strHtml = '';
	var data =
	{
		action: "getAllSearchWords"
	}
	$.ajaxSetup({async: false});
	$.post("php/manageBackend.php", data)
	.always(function(data)
	{
		// console.log(data);
		for (var key in data)
		{
			strHtml += '<option value="' + data[key] + '">';
		}
		$('#schlagwoerter')[0].innerHTML = strHtml;
	});
	$.ajaxSetup({async: true});
}

// wird beim Klick auf Sperrvermerk ausgeführt
function changeSperrvermerk()
{
	if(document.formUpload.sperrvermerk.checked)
	{
		$('#FileInputUploadArbeit').attr('required', false);
		document.formUpload.sperrvermerk.value = "1";
		$('#divFileInputUploadArbeit').hide();
	}
	else
	{
		$('#FileInputUploadArbeit').attr('required', true);
		document.formUpload.sperrvermerk.value = "0";
		$('#divFileInputUploadArbeit').show();
	}
}
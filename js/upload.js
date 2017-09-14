$(document).ready(function() {
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
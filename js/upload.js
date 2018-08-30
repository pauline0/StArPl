$(document).ready(function() {
	// FileUploadArbeit
	$("#FileInputUploadArbeit").fileinput({
        showUpload: false,
		allowedFileTypes: ['pdf'],
        overwriteInitial: true,
		maxFileCount: 20,
		browseClass: "btn btn-primary",
        browseLabel: "&nbsp;Datei(en) auswählen [*.pdf]",
		browseIcon: "<i class=\"glyphicon glyphicon-folder-open\"></i>",
		removeClass: "btn btn-danger",
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
	})
	.on('submit', uploadForm);
	// Schlagwörter-datalist füllen
	fillDataListSchlagwoerter();
	fillDocentList();

});

// wird beim hochladen aufgerufen
function upload()
{
	var returnValue = false;
	var tmpId = 0;
	var data = $('#formUpload').serialize();
	data += '&action=formUpload';
	$.ajaxSetup({async: false});
	$.post("php/manageBackend.php", data)
	.always(function(data)
	{
		tmpId = data[0];
	});
	$.ajaxSetup({async: true});
	if (tmpId > 0)
	{
		returnValue = uploadFiles(tmpId);
	}
	return returnValue;
}

function uploadForm(event)
{
	event.preventDefault();
	var returnValue = false;
	var tmpId = 0;
	var data = $('#formUpload').serialize();
	data += '&action=formUpload';
	$.post(settings.phpBackend, data)
	.done(function(data, status, xhr){
		var tmpId = data["fileId"];
		console.log("success")
		var redirect_location = data["location"];
		uploadFiles(tmpId, redirect_location);
	})
	.fail(function(data, status, xhr)
		{
			showErrors();
		}
	);
}

function showErrors(){
	console.log("not implemented yet");
}

// Dateien hochladen
function uploadFiles(id, redirect_location)
{
	var returnValue = false;
	var form_data = new FormData();
	for (var i = 0; i < $('#FileInputUploadArbeit').prop('files').length; i++)
	{
		var file_data = $('#FileInputUploadArbeit').prop('files')[i];
		form_data.append('file' + i, file_data);
	}
	form_data.append('id', id);
	form_data.append('action', 'fileUpload');
	form_data.append('csrf_token', $('#csrf_token')[0].value);
	$.ajaxSetup({async: false});
	$.ajax({
		url: './php/manageBackend.php', // point to server-side PHP script
		dataType: 'text',  // what to expect back from the PHP script, if anything
		cache: false,
		contentType: false,
		processData: false,
		data: form_data,
		type: 'post',
		success: function(data)
		{
			returnValue = true;
			document.location.href = redirect_location;
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
	$.post("php/manageBackend.php", data)
	.always(function(data)
	{
		for (var key in data)
		{
			strHtml += '<option value="' + data[key] + '">';
		}
		$('#schlagwoerter')[0].innerHTML = strHtml;
	});
}

// wird beim Klick auf Sperrvermerk ausgeführt
function changeSperrvermerk()
{
	if(document.formUpload.sperrvermerk.checked)
	{
		$('#FileInputUploadArbeit').attr('required', false);
		$($.find('button.btn.btn-danger.fileinput-remove.fileinput-remove-button')[0]).click();
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


function fillDocentList(){
	var strHtml = '';
	var data =
	{
		action: "getPossibleDocents"
	}
	$.post("php/manageBackend.php", data)
	.always(function(data)
	{
		if (!data[0]){
			$("#selectDocents").hide();
			$("#divEditButtons").show();
		}
		else {
			for (var key in data[1])
			{
				strHtml += '<option value="' + data[1][key] + '">'+key + '</option>';
			}
			$('#selectDocents')[0].innerHTML = strHtml;
		}
	});
}

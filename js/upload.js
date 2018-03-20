var ownUser;
﻿$(document).ready(function() {
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
	});

	// Schlagwörter-datalist füllen
	fillDataListSchlagwoerter();
	fillDocentList();

	getOwnUser();
	if(ownUser[0].UserRole > 0){
		$("#divEditButtons").show();
	}
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

// Dateien hochladen
function uploadFiles(id)
{
	var returnValue = false;
	var form_data = new FormData();
	for (var i = 0; i < $('#FileInputUploadArbeit').prop('files').length; i++)
	{
		var file_data = $('#FileInputUploadArbeit').prop('files')[i];
		form_data.append('file' + i, file_data);
	}
	form_data.append('id', id);
	form_data.append('action', 'fileAjaxUpload');
	form_data.append('sperrvermerk', $('#sperrvermerk')[0].value);
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
	$.ajaxSetup({async: false});
	$.post("php/manageBackend.php", data)
	.always(function(data)
	{
		console.log(data);
		if ($.isEmptyObject(data)){
			/*Wenn die Rückgabe leer ist, ist der Benutzer kein Stundent, da Studenten sich nicht ohne einen gültigen
			Account anmelden können */
			$("#selectDocents").hide();
			$("#divEditButtons").show();
		}
		else {
			for (var key in data)
			{
				strHtml += '<option value="' + data[key] + '">'+key + '</option>';
			}
			$('#selectDocents')[0].innerHTML = strHtml;
		}
	});
	$.ajaxSetup({async: true});
}


function getOwnUser()
{
	var data =
	{
		action: "getOwnUser"
	}
	$.ajaxSetup({async: false});
	$.post("php/manageBackend.php", data)
	.always(function(data)
	{
		ownUser = data;
	});
	$.ajaxSetup({async: true});
}

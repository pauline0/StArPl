// globale Variablen
var arrayAllArbeiten = null;
var arrayIdsArbeiten = null;
var arraySelectedArbeiten = null;
var arrayTableSelectedArbeiten = null;
var arrayAllSearchWordsWithId = null;
// var ownUser = null;
var arrayTableDetailledView = settings.detailTableColumns;
var documentTable = null;
$(document).ready(function() {
	// Navigation zwischen den Fachbereichen
	getAllDocuments();
	getGetParas();
	prepareTableHeader();
	user.getCurrent();

	$('#editLink').click(changeToEdit);
	$('#starplLink').click(resetStudiengangSelection);
	$('#toggleDocumentSelection').click(showMyFiles);

	edit_col_hidden = ($_GET().edit) ? true : false

	documentTable = $('#tableOverview').DataTable
	(
		{
			"language":
			{
				"url": "js/dataTableGerman.json"
			},
			"columnDefs": [
				{
						"targets": [0, -2],
						"render": null
				},
				{
						"targets": [-1],
						"render": null,
						"visible":edit_col_hidden,
						"sortable": false
				},
				{
					"targets": '_all',
					"render": $.fn.dataTable.render.text()
				}
			]
		}
	);
	if ($_GET().id)
	{
		if($_GET().hidden){
			showHiddenArbeit($_GET().id)
		}
		else{
			showArbeitDetailled($_GET().id);
		}
	}
	else
	{
		changeFachbereich($_GET().studiengang, "replaceState");
	}
	$('.nav.fb_side li')
	.click
	(
		function()
		{
			changeFachbereich($(this)[0].innerText);//value);
		}
	);
});

window.onpopstate = function(event) {
	getGetParas();
	console.log("pop_state");
	changeFachbereich($_GET().studiengang, "replaceState");
};

function showLogoutButton(){
	$('#logoutLink').show();
}

// erstellt den tableHeader
function prepareTableHeader()
{
	var strHtml = "<tr>"
	for (var i = 0; i < settings.viewAllTableColumns.length; i++){
		if (settings.viewAllTableColumns[i][1]){
			strHtml += "<th>" + settings.viewAllTableColumns[i][1] + "</th>"
		}
}

	strHtml += '<th><span class="glyphicon glyphicon-pencil"></span></th>';

	strHtml += '</tr>';
	$('#tableHeader')[0].innerHTML = strHtml;
}

// update der DataTable
function reloadDataTable()
{
	arrayTableSelectedArbeiten = new Array();
	for (var key in arraySelectedArbeiten)
	{
		var arrayOneRow = new Array();
		for (var i = 0; i < settings.viewAllTableColumns.length; i++){
			[propertyName, renderFunc] = [ settings.viewAllTableColumns[i][0], settings.viewAllTableColumns[i][2]]
			if (renderFunc){
				arrayOneRow.push(renderFunc(arraySelectedArbeiten[key]));
			}
			else{
				arrayOneRow.push(arraySelectedArbeiten[key][propertyName]);
			}
		}

		// if ($_GET().edit)
		// {
			if (user.current.id == arraySelectedArbeiten[key].user_id || user.current.user_role == '2') // verfügt der User über Bearbeitungsrecht?
			{
				arrayOneRow.push('<a onclick="showArbeitDetailled(' + arraySelectedArbeiten[key].id + ');"><span class="glyphicon glyphicon-pencil"></span></a><span hidden> own </span>');
			}
			else
			{
				arrayOneRow.push('');
			}
		// }

		arrayTableSelectedArbeiten.push(arrayOneRow);

	}
	$('#tableOverview').DataTable().clear();
	$('#tableOverview').DataTable().rows.add(arrayTableSelectedArbeiten);
	$('#tableOverview').DataTable().draw();
}

// lädt alle Arbeiten aus der Datenbank
function getAllDocuments()
{
	arrayIdsArbeiten = new Array();
	var data =
	{
		action: "getAllDocuments"
	}
	$.ajaxSetup({async: false});
	$.post(settings.phpBackend, data)
	.always(function(data)
	{
		arrayAllArbeiten = data;
		for (var key in arrayAllArbeiten)
		{
			arrayIdsArbeiten.push(arrayAllArbeiten[key].id);
		}
		getAllSearchWordsWithId();
	});
	$.ajaxSetup({async: true});
}

function showMyFiles(event){
	event.preventDefault()
	documentTable.column(-1).search("own").draw();
	console.log("test");
	$('#toggleDocumentSelection').text("Alle Dateien anzeigen");
	$('#toggleDocumentSelection').unbind("click");
	$('#toggleDocumentSelection').click(showAllFiles);
}

function showAllFiles(event){
	event.preventDefault()
	documentTable.column(-1).search("").draw();
	$('#toggleDocumentSelection').text("Nur meine Dateien anzeigen");
	$('#toggleDocumentSelection').unbind("click");
	$('#toggleDocumentSelection').click(showMyFiles);
}

// gibt alle Schlagwörter aus
function getAllSearchWordsWithId()
{
	arrayAllSearchWordsWithId = new Array();
	var data =
	{
		action: "getAllSearchWordsWithId"
	}
	$.post(settings.phpBackend, data)
	.always(function(data)
	{
		arrayAllSearchWordsWithId = data;
		for (var keyArbeiten in arrayAllArbeiten)
		{
			var idArray = $.inArray(keyArbeiten.toString(), arrayIdsArbeiten);
			var arraySearchWords = new Array();
			for (var keySearch in arrayAllSearchWordsWithId)
			{

				if (arrayAllSearchWordsWithId[keySearch].file_id == arrayAllArbeiten[keyArbeiten].id.toString())
				{
					arraySearchWords.push(arrayAllSearchWordsWithId[keySearch].word);
				}
			}
			arrayAllArbeiten[keyArbeiten]['searchWords'] = arraySearchWords;
		}
	});
}

function changeToEdit(event){
	event.preventDefault();
	var studiengang = window.location.search.match(/studiengang=\w*/);
	var newstate = "?edit"
	getGetParas();
	if ($_GET().id){
		var selectedArbeit = getSelectedArbeit($_GET().id);
		setButtonsInDetailView(selectedArbeit);
		newstate += "&" + "id=" + $_GET().id;
	}
	if (studiengang && studiengang.length > 0) {
		newstate += "&" + studiengang[0];
	}

	$("#editLink").addClass("active");
	window.history.pushState(studiengang[0], studiengang[0], newstate);
	documentTable.column(-1).visible(true);
	getGetParas();
	// prepareTableHeader();
	// reloadDataTable();
}

function resetStudiengangSelection(event){
	event.preventDefault();
	changeFachbereich();
}

// wird beim Wechsel des Fachbereichs Aufgerufen
function changeFachbereich(selectedStudiengang, historyFunc="pushState")
{
	arraySelectedArbeiten = new Array();
	selectedStudiengang = selectedStudiengang || '';
	selectedStudiengang = selectedStudiengang.trim();
	for (var key in arrayAllArbeiten)
	{
		if (arrayAllArbeiten[key].fb == selectedStudiengang || '' == selectedStudiengang || undefined == selectedStudiengang)
		{
			arraySelectedArbeiten.push(arrayAllArbeiten[key]);
		}
	}
	$('#headLineStudiengang')[0].innerHTML = selectedStudiengang;
	$('#divTableOverview').show();
	$('#tableDetailledArbeit').hide();
	$('#arbeitSearchwords').hide();
	reloadDataTable();
	if ($_GET().edit)
	{
	 window.history[historyFunc]('', '', '?edit&studiengang=' + selectedStudiengang);
	}
	else
	{
		window.history[historyFunc]('', '', '?studiengang=' + selectedStudiengang);
	}
	resetArbeit();
	$('.active_fb').removeClass('active_fb');

	if ( selectedStudiengang && selectedStudiengang.length > 0){
		$('li:contains("'+selectedStudiengang +'")').addClass('active_fb');
		documentTable.column(2).visible(false);
	}
	else {
		documentTable.column(2).visible(true);
	}
	$('#editButtons').hide();
	$('.editOnly').hide();
	$("#buttonPublishDoc").hide();
}

function getSearchwordLabel(content, value, labelClass="default", additionalAttr=""){
	return '<span class="label label-'+labelClass+'"'+ additionalAttr +'>' + htmlEncode(content) + '</span> '
}

function renderArbeitKeywords(searchWords){
	swString = ""
	if (searchWords){
		for (var i = 0; i < searchWords.length; i++){
			swString += getSearchwordLabel(searchWords[i], searchWords[i]) + " ";//'<span class="label label-default">' + searchWords[i] + '</span> '
		}
	}
	return swString;
}

function renderFiles(selectedArbeit){
	var strHtml = "";
	var files = selectedArbeit.dateien;
	for (var fileIdx = 0; fileIdx < files.length; fileIdx++)
	{
		var selectedFile = files[fileIdx];
		strHtml += '<a target="_blank" href="upload/' + selectedArbeit.id + '/' + selectedFile + '" onclick="downloadFile(' + selectedArbeit.id + ');">';
		if (selectedFile.substr(selectedFile.length - 4, 4) == '.pdf')
		{
			strHtml += '<img src="'+ settings.iconFilePdf +'">';
		}
		strHtml += selectedFile + '</a><br/>';
	}
	return strHtml;
}

function renderFilesEdit(selectedArbeit){
	var strHtml = "";
	for (var file in selectedArbeit.dateien)
	{
		var selectedFile = selectedArbeit.dateien[file];
		strHtml += '<div><a target="_blank" href="upload/' + selectedArbeit.id+ '/' + selectedFile + '">';
		if (selectedFile.substr(selectedFile.length - 4, 4) == '.pdf')
		{
			strHtml += '<img src="img/pdf.png">';
		}
		strHtml += selectedFile + ' </a> <span class="glyphicon glyphicon-trash" onclick="deleteFile($(this),'+selectedArbeit.id+')"></span></div>';
	}
	return strHtml;
}

function getArbeitTableHTML(selectedArbeit){
	var strHtml = '';
	for (var subArray in arrayTableDetailledView)
	{
		strHtml +=
			'<tr>' +
				'<th>' + arrayTableDetailledView[subArray][1] + '</th>' +
				'<td>' + htmlEncode(selectedArbeit[arrayTableDetailledView[subArray][0]]) + '</td>' +
			'</tr>';
	}
	if (user.current.user_role == 2 || user.current.id == selectedArbeit.user_id)
	{
		strHtml +=
			'<tr>' +
				'<th>Downloads</th>' +
				'<td id="downloadsValue">' + selectedArbeit.downloads + '</td>' +
			'</tr>';
	}
	strHtml +=
			'<tr>' +
				'<th>Datei(en)</th>' +
				'<td>';

	strHtml += renderFiles(selectedArbeit) +
				'</td>' +
			'</tr>';

	return strHtml;
}

function renderSearchwords(selectedArbeit){
	var html = "Schlagworte: " + renderArbeitKeywords(selectedArbeit["searchWords"])
	return html;
}

function getSelectedArbeit(id){
	var idArray = $.inArray(id.toString(), arrayIdsArbeiten);
	return arrayAllArbeiten[idArray];
}

// detaillierte Übersicht über eine Arbeit

function showArbeitDetailled(Id)
{
	var selectedArbeit = getSelectedArbeit(Id);

	if (selectedArbeit != undefined)
	{
		$('#tableBodyDetailledArbeit')[0].innerHTML = getArbeitTableHTML(selectedArbeit);
		$('#headLineStudiengang')[0].innerHTML = '<a onclick="changeFachbereich(\'' + selectedArbeit.fb + '\');">' + selectedArbeit.fb + '</a> > ' + htmlEncode(selectedArbeit.title);
		$('#arbeitSearchwords')[0].innerHTML = renderSearchwords(selectedArbeit)
		$('#divTableOverview').hide();
		$('#tableDetailledArbeit').show();
		$('#arbeitSearchwords').show()
		if ($_GET().edit)
		{
			window.history.replaceState('', '', '?edit&studiengang=' + selectedArbeit.fb + '&id=' + selectedArbeit.id);
			setButtonsInDetailView(selectedArbeit);
		}
		else
		{
			$('.editOnly').hide();
			$('#editButtons').hide();
			window.history.replaceState('', '', '?studiengang=' + selectedArbeit.fb + '&id=' + selectedArbeit.id);
		}
	}
	else
	{
		changeFachbereich();
	}
}

function setButtonsInDetailView(selectedArbeit){
	if (user.current.id == selectedArbeit.user_id || user.current.user_role == '2')
	{
		$('#editButtons').show();
	}
	else
	{
		$('#editButtons').hide();
	}
	$('.editOnly').hide();
}

function getCsrfToken(){
	return $("#csrf_token").val();
}

function getHiddenArbeit(id){
	var hiddenArbeit;
	var role;
	var data =
	{
		action: "getHiddenDocument",
		id: id,
		csrf_token: getCsrfToken()
	}
	$.ajaxSetup({async: false});
	$.post(settings.phpBackend, data)
	.always(function(data)
	{
		if (data[0] >= 0 ){
			role = data[0];
			hiddenArbeit = data[1];
		}
		else{
			changeFachbereich();
		}
	});
	$.ajaxSetup({async: true});
	return hiddenArbeit;
}

function showHiddenArbeit(id){
	arrayIdsArbeiten = new Array();
	var hiddenArbeit = getHiddenArbeit(id);
	if (hiddenArbeit){
		$('#tableBodyDetailledArbeit')[0].innerHTML = getArbeitTableHTML(hiddenArbeit);
		$('#arbeitSearchwords')[0].innerHTML = renderSearchwords(hiddenArbeit)
		$('#divTableOverview').hide();
		$('#tableDetailledArbeit').show();
		$('.editOnly').hide();
		arrayAllArbeiten.push(hiddenArbeit);
		if (user.current.user_role >=  1){
			$('#editButtons').hide();
			$('#buttonPublishDoc').removeClass("hidden");
			$('#buttonPublishDoc').unbind("click");
			$('#buttonPublishDoc').click(function(){
				releaseDocument(hiddenArbeit.id, hiddenArbeit.fb)
			});
		}
	}
}

function releaseDocument(id, studiengang){
	var data =
	{
		action: "releasePrivateDocument",
		id: id,
		csrf_token: getCsrfToken()
	}
	$.ajaxSetup({async: false});
	$.post(settings.phpBackend, data)
	.always(function(data)
	{
		console.log(data);
	});
	window.history.replaceState('', '', '?studiengang=' + studiengang + '&id=' + id);
	location.reload();
}

// zählt den Counter für Downloads hoch
function downloadFile(Id)
{
	var data =
	{
		action: 'incrementDownloads',
		id: Id
	}
	$.ajaxSetup({async: false});
	$.post(settings.phpBackend, data)
	.always(function(data)
	{
		var idArray = $.inArray(Id.toString(), arrayIdsArbeiten);
		arrayAllArbeiten[idArray].downloads = parseInt(arrayAllArbeiten[idArray].downloads)
		arrayAllArbeiten[idArray].downloads += 1;
		$('#downloadsValue')[0].innerHTML = arrayAllArbeiten[idArray].downloads;
	});
	$.ajaxSetup({async: true});
}

// ============================================================
// ausschließlich für den edit-Bereich erforderlich / sinnvoll
// ============================================================

function getOptionsForSelect(name){
	var options = settings.select[name];
	var oStr = ""
	for (var  i = 0; i < options.length; i++){
		oStr += '<option value="' + options[i] + '">'+ options[i] +'</option>'
	}
	return oStr
}


// wechselt in den Bearbeitungsmodus
function editArbeit()
{
	getGetParas();
	if ($_GET().hidden){
		var selectedArbeit = getHiddenArbeit($_GET().id);
	}
	else {
		var idArray = $.inArray($_GET().id.toString(), arrayIdsArbeiten);
		var selectedArbeit = arrayAllArbeiten[idArray];
	}
	buildEditForm(selectedArbeit);
}

function buildEditForm(selectedArbeit){
	var cuttedArrayTableDetailledView = arrayTableDetailledView.slice(0, -1);
	var arrayTableEdit =
	[
		'<input class="form-control" id ="' + arrayTableDetailledView[0][0] + '" name="' + arrayTableDetailledView[0][0] + '" required />',
		'<input class="form-control" id ="' + arrayTableDetailledView[1][0] + '" name="' + arrayTableDetailledView[1][0] + '" required />',
		'<select class="form-control" id="studiengang" name="studiengang" required>' +
			getOptionsForSelect("studiengang") +
		'</select>',

		'<select class="form-control" id="language" name="language" required>' +
			getOptionsForSelect("sprache") +
		'</select>',

		'<select class="form-control" id="artOfArbeit" name="artOfArbeit" required>' +
				getOptionsForSelect("typ") +
		'</select>',

		'<input class="form-control" id ="' + arrayTableDetailledView[5][0] + '" name="' + arrayTableDetailledView[5][0] + '" required pattern="[0-9]{4}" />',
		'<input class="form-control" id ="' + arrayTableDetailledView[6][0] + '" name="' + arrayTableDetailledView[6][0] + '" required />',
		'<input class="form-control" id ="' + arrayTableDetailledView[7][0] + '" name="' + arrayTableDetailledView[7][0] + '" required />'
	]
	var strHtml = '';
	for (var subArray in cuttedArrayTableDetailledView)
	{
		strHtml +=
			'<tr>' +
				'<th>' + cuttedArrayTableDetailledView[subArray][1] + '</th>' +
				'<td>' + arrayTableEdit[subArray] + '</td>' +
			'</tr>';
	}
	strHtml +=
		'<tr>' +
			'<th>' + arrayTableDetailledView[arrayTableDetailledView.length - 1][1] + '</th>' +
			'<td><textarea class="form-control" rows="5" id ="' + arrayTableDetailledView[arrayTableDetailledView.length - 1][0] + '" name="' + arrayTableDetailledView[arrayTableDetailledView.length - 1][0] +'" required>' + selectedArbeit[arrayTableDetailledView[arrayTableDetailledView.length - 1][0]] + '</textarea></td>' +
		'</tr>';
	strHtml +=
		'<tr>' +
			'<th>Datei(en)</th>' +
			'<td>';
	strHtml += edit.renderFiles(selectedArbeit)//renderFilesEdit(selectedArbeit)
	strHtml +=
			'<input id="editFileInput" name="editFileInput" type="file" class="file" data-show-preview="false" multiple>' +
			'</td>' +
		'</tr>';

	$('#tableBodyDetailledArbeitEdit')[0].innerHTML = strHtml;
	initEditValues(selectedArbeit);
	$('#studiengang')[0].value = selectedArbeit[arrayTableDetailledView[2][0]];
	$('#language')[0].value = selectedArbeit[arrayTableDetailledView[3][0]];
	$('#artOfArbeit')[0].value = selectedArbeit[arrayTableDetailledView[4][0]];
	$('#tableBodyDetailledArbeit').hide();
	$('#tableBodyDetailledArbeitEdit').show();
	$('#editButtons').hide();
	$('.editOnly').show	();
	$("#editFileInput").fileinput({
			showUpload: false,
			allowedFileTypes: ['pdf'],
					overwriteInitial: true,
			maxFileCount: 20,
			maxFileSize:2000,
			browseClass: "btn btn-primary",
					browseLabel: "&nbsp;Datei(en) hinzufügen [*.pdf]",
			browseIcon: "<i class=\"glyphicon glyphicon-folder-open\"></i>",
			removeClass: "btn btn-danger",
					removeLabel: "&nbsp;Löschen" });
	edit.displaySearchWords(selectedArbeit.searchWords)
}

function initEditValues(selectedArbeit){
	for (var i = 0; i < arrayTableDetailledView.length; i++){
		$("input[name='" + arrayTableDetailledView[i][0] +"']").val(selectedArbeit[arrayTableDetailledView[i][0]])
	}
}

function uploadFilesO(id){
	var fileCount =  $('#editFileInput').prop('files').length;
	var countFinished = 0;
	var returnValue = false;
	var csrf_token = $('#csrf_token').val();
	for (var i = 0; i < fileCount; i++)
	{
		var form_data = new FormData();
		var file_data = $('#editFileInput').prop('files')[i];
		form_data.append('file' + i, file_data);
		form_data.append('id', id);
		form_data.append('action', 'fileUpload');
		form_data.append('csrf_token', csrf_token);		$.ajaxSetup({async: false});
		$.ajax({
			url: './php/manageBackend.php', // point to server-side PHP script
			dataType: 'text',  // what to expect back from the PHP script, if anything
			cache: false,
			contentType: false,
			processData: false,
			data: form_data,
			type: 'post',
			done: function(){
				countFinished += 1;
				if (countFinished == fileCount){
					return true;
				}
			 }
			});
	}
}

// verlässt den Bearbeitungsmodus
function resetArbeit()
{
	$('#tableBodyDetailledArbeit').show();
	$('#tableBodyDetailledArbeitEdit').hide();
	$('#editButtons').show();
	$('.editOnly').hide();
	return false;
}


function deleteFile(delButton,id){
	fileElement = delButton.parent();
	fileElement.addClass("delFile");
	fileElement.html(getFileDeleteText(fileElement.text(), id))
}

function rmFileDeleteRequest(undoButton,id){
	fileElement = undoButton.parent();
	fileElement.removeClass("delFile");
	fileElement.html(getFileText(fileElement.text(),id));
}

function getFileDeleteText(text,id){
	innerHTML = text + '</a> <span class="glyphicon glyphicon-repeat" onclick="rmFileDeleteRequest($(this),'+id+')"></span>';
	if(text.trim().substr(-4,4) == ".pdf"){
		innerHTML = '<img src="img/pdf.png">' + innerHTML;
	}
	innerHTML = '<a target="_blank" href="upload/' + id+ '/' + text + '">' + innerHTML;
	return innerHTML;
}

function getFileText(text,id){
	innerHTML =text + '</a> <span class="glyphicon glyphicon-trash" onclick="deleteFile($(this),'+id+')"></span>';
	if(text.trim().substr(-4,4) == ".pdf"){
		innerHTML = '<img src="img/pdf.png">' + innerHTML;
	}
	innerHTML = '<a target="_blank" href="upload/' + id+ '/' + text + '">' + innerHTML;
	return innerHTML;
}

function uploadFiles(id)
{
	var returnValue = false;
	var form_data = new FormData();
	var csrf_token = $('#csrf_token').val();
	var no_of_files = $('#editFileInput').prop('files').length;
	for (var i = 0; i < no_of_files; i++)
	{
		var file_data = $('#editFileInput').prop('files')[i];
		form_data.append('file' + i, file_data);
	}
	form_data.append('id', id);
	form_data.append('action', 'fileUpload');
	form_data.append('csrf_token', csrf_token);
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
		},
		error: function(data,status){
			returnValue = false;
		}
	});
	$.ajaxSetup({async: true});
	return returnValue;
}


// speichert die Arbeit
function saveArbeit()
{
	getGetParas();
	var addSW = [];
	var delSW = [];
	var delFiles = [];
	$(".addSW").each(function (idx,elem){
	 	var value = $(elem).data("sw").toString();
		if (value){
			addSW.push(value.trim());
		}
	});
	$(".delSW").each(function (idx, elem){
		var value = $(elem).data("sw");
		if (value){
			delSW.push(value.trim());
		}
	});
	$(".delFile").each(function(idx, elem){
		delFiles.push(elem.textContent.trim());
	})
	var data = $('#formUpdateDocument').serialize();
	data += "&csrf_token=" +getCsrfToken();
	data += '&action=formUpdateDocument&id=' + $_GET().id +
					"&deleteSW="+JSON.stringify(delSW)+
					"&addSW="+JSON.stringify(addSW);
	data += '&delFiles='+JSON.stringify(delFiles);
	$.ajaxSetup({async: false});
	$.post(settings.phpBackend, data);
	$.ajaxSetup({async: true});
	returnValue = uploadFiles($_GET().id);
	resetArbeit();
	getAllDocuments();
	user.getCurrent();
	showArbeitDetailled($_GET().id);
	arraySearchwordOperations = [];
	return false;
}

// löscht eine Arbeit vollständig
function deleteDocument()
{
	if (confirm('Möchten Sie diese Arbeit wirklich löschen?'))
	{
		getGetParas();
		var idArray = $.inArray($_GET().id.toString(), arrayIdsArbeiten);
		var id = arrayAllArbeiten[idArray].id;
		var data =
		{
			action: "deleteDocument",
			id: id,
			csrf_token: getCsrfToken()
		}
		$.ajaxSetup({async: false});
		$.post(settings.phpBackend, data)
		.always(function(data)
		{
			// console.log(data);
			// Achtung, Fake-Meldung
			/*if(true)
			{*/
				alert('Der Bericht wurde erfolgreich gelöscht.');
			/*}
			else // NICHT erfolgreich gelöscht
			{
				alert('Der Bericht konnte nicht gelöscht werden.');
			}*/
			getAllDocuments();
			user.getCurrent();
			changeFachbereich();
		});
		$.ajaxSetup({async: true});
	}
}

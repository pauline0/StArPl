// globale Variablen
var arrayAllSearchWordsWithId = null;

var arrayTableDetailledView = settings.detailTableColumns;
var documentTable = null;
var currentDocument = {}

var templates = {
	show: null,
	edit: null,
	editButton: "<a onclick=\"getDocumentById({{id}});\"><span class=\"glyphicon glyphicon-pencil\"></span></a><span hidden>1</span>"
}

Mustache.parse(templates["editButton"])

function loadMustacheTemplate(name, tpl_name,path, onload){
	$.get(path, function(data) {
		templates[name] = $(data).filter("#"+tpl_name).html();
		onload()
	});
}

$(document).ready(function() {
	// Navigation zwischen den Fachbereichen
	getGetParas();
	prepareTableHeader();
	user.getCurrent();

	$('#editLink').click(changeToEdit);
	$('#starplLink').click(resetFbSelection);
	$('#toggleDocumentSelection').click(showMyFiles);

	edit_col_hidden = ($_GET().edit) ? true : false

	documentTable = $('#tableOverview').DataTable
	(
		{
			"language":
			{
				"url": "js/dataTableGerman.json"
			},
			// "responsive":true,
			"scrollX": true,
			"ajax": "/php/table.php?action=documents",
			"columns": [
					{ "data": "id" },
          { "data": "title" },
          { "data": "student" },
          { "data": "fb" },
          { "data": "language" },
          { "data": "type" },
          { "data": "year" },
					{ "data": "docent" },
					{ "data": "company" },
					{ "data": "search_words"},
					{ "data": "editable" }
      ],
			"columnDefs": [
				{
						"targets": 0,
						"visible": false
				},
				{
						"targets": [1],
						"render": function(data, type, row) {
							return '<a onclick="getDocumentById(' + row["id"]+ ');">' + htmlEncode(data) + '</a>'
						}
				},
				{
					"targets": [-2],
					"visible": false,
					"sortable": true
				},
				{
					"targets": [-1],
					"render": function(data, type, row) {
						if (row["editable"]){
							return Mustache.render(templates.editButton, {id:row["id"]})
						}
						else{
							return ""
						}
					},
					"visible":edit_col_hidden,
					"sortable": false,
					"searchable":true
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
			getPrivateDocument($_GET().id, displayDocument)
		}
		else{
			showDocument($_GET().id);
		}
	}
	else
	{
		changeFb($_GET().studiengang, "replaceState");
	}
	$('.nav.fb_side li')
	.click
	(
		function()
		{
			changeFb(this.id.substr(3));
		}
	);
});

window.onpopstate = function(event) {
	getGetParas();
	if ($_GET().id)
	{
		if($_GET().hidden){
			showHiddenDocument($_GET().id)
		}
		else{
			showDocument($_GET().id);
		}
	}
	else
	{
		changeFb($_GET().studiengang, "replaceState");
	}
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
	documentTable.ajax.reload();
}

function showMyFiles(event){
	event.preventDefault()
	//TODO this is a workaround
	documentTable.column(-1).search("1").draw();
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
		// var selectedArbeit = getSelectedDocument($_GET().id);
		// setButtonsInDetailView(selectedArbeit);
		newstate += "&" + "id=" + $_GET().id;
	}
	if (studiengang && studiengang.length > 0) {
		newstate += "&" + studiengang[0];
	}

	$("#editLink").addClass("active");
	window.history.pushState(studiengang[0], studiengang[0], newstate);
	documentTable.column(-1).visible(true);
}

function resetFbSelection(event){
	event.preventDefault();
	changeFb();
}

// wird beim Wechsel des Fachbereichs aufgerufen
function changeFb(selectedFb, historyFunc="pushState")
{
	selectedFbIdx = parseInt(selectedFb)
	if (selectedFbIdx != NaN && selectedFb < settings.select.fb.length){
		selectedFbStr = settings.select.fb[selectedFbIdx].toString();
	}
	else {
		selectedFbStr = selectedFbIdx = ""
	}
	$('#headLineStudiengang')[0].innerHTML = selectedFbStr;
	$('#divTableOverview').show();
	$('#tableDetailledArbeit').hide();
	$('#arbeitSearchwords').hide();
	documentTable.ajax.url("/php/table.php?action=documents&fb="+selectedFbIdx).load(function(){
		if ( selectedFbIdx !== null && selectedFbStr.length > 0){
			documentTable.column(3).visible(false);
		}
		else {
			documentTable.column(3).visible(true);
		}
	})

	getGetParas();
	if ($_GET().edit)
	{
	 window.history[historyFunc]('', '', '?edit&studiengang=' + selectedFbIdx);
	}
	else
	{
		window.history[historyFunc]('', '', '?studiengang=' + selectedFbIdx);
	}

	resetDocument();
	$('.active_fb').removeClass('active_fb');

	if ( selectedFb !== null && selectedFbStr.length > 0){
		$("#fb_"+selectedFbIdx).addClass("active_fb");
	}

	$('#editButtons').hide();
	$('.editOnly').hide();
	$("#buttonPublishDoc").hide();
}

function getSearchwordLabel(content, value, labelClass="default", additionalAttr=""){
	return '<span class="label label-'+labelClass+'"'+ additionalAttr +'>' + htmlEncode(content) + '</span> '
}

function getSelectedDocument(id, callback){
	if (currentDocument["id"] === id){
		callback(currentDocument)
	}
	else{
		loadDocument(id, callback)
	}
}

function loadDocument(id, callback){
	$.getJSON("/php/table.php", {"action": "document","id":id} , function(document)
		{
			currentDocument = document
			callback(document)
	});
}

function getDocumentById(id){
	getSelectedDocument(id, displayDocument);
	// $.getJSON("/php/table.php", {"action": "document","id":id} , function(document)
	// 	{
	// 		currentDocument = document
	// 		displayDocument(document)
	// });
}

function displayDocument(document){
	var initShowView = function(){
		$('#updateDocument').empty();
		$('#updateDocument').append(Mustache.render(templates.show, templateData));
		getGetParas()
		if ($_GET().edit)
		{
			window.history.replaceState('', '', '?edit&studiengang=' + document.fb + '&id=' + document.id);
			// setButtonsInDetailView(document);
		}
		else
		{
			// $('#editButtons').hide();
			window.history.replaceState('', '', '?studiengang=' + document.fb + '&id=' + document.id);
		}
		$("#editButton").unbind("click");
		$("#editButton").click(editArbeit);
	}
	document.fb_str = settings.select.fb[document.fb]
	var templateData = {
		"strTitle": settings.detailTableColumns[0][1],
		"strStudent": settings.detailTableColumns[1][1],
		"strFb": settings.detailTableColumns[2][1],
		"strLang": settings.detailTableColumns[3][1],
		"strType": settings.detailTableColumns[4][1],
		"strYear": settings.detailTableColumns[5][1],
		"strDocent": settings.detailTableColumns[6][1],
		"strCompany": settings.detailTableColumns[7][1],
		"strAbstract": settings.detailTableColumns[8][1],
		"strRestricted": settings.detailTableColumns[9][1],
		"restricted": (document.restricted === "1"),
		"restrictedVal": settings.yesno[document.restricted],
		"strFiles": "Datei(en)",
		"strSearchwords": "Schlagwörter",
		"document": document,
		"files": document.dateien
	}
	if (templates.show){
		initShowView()
	}
	else {
		loadMustacheTemplate("show", "tpl-show","partials/_show.html", initShowView);
	}
	$('#headLineStudiengang')[0].innerHTML = '<a onclick="changeFb(\'' + document.fb + '\');">' + document.fb_str + '</a> > ' + htmlEncode(document.title);
	$('#divTableOverview').hide();
}

// detaillierte Übersicht über eine Arbeit

function showDocument(id)
{
	getSelectedDocument(id, function(selectedDocument){
		if (selectedDocument)
		{
			displayDocument(selectedDocument);
		}
		else
		{
			changeFb();
		}
	});
}

function getCsrfToken(){
	return $("#csrf_token").val();
}

function getPrivateDocument(id, callback,additionalOptions={}){
	var hiddenDocument;
	var role;
	var stdOptions =
	{
		action: "getHiddenDocument",
		id: id,
		csrf_token: getCsrfToken()
	}
	var data = {...stdOptions,...additionalOptions }
	$.post(settings.phpBackend, data).done(callback)
}


function getHiddenDocument(id){
	var hiddenDocument;
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
			hiddenDocument = data[1];
		}
		else{
			changeFb();
		}
	});
	$.ajaxSetup({async: true});
	return hiddenDocument;
}

function showHiddenDocument(id){
	var hiddenDocument = getHiddenDocument(id);

	var initShowView = function(){
		$('#updateDocument').empty();
		$('#updateDocument').append(Mustache.render(templates.show, templateData));
			setButtonsInDetailView(hiddenDocument);
			if (user.current.user_role >=  1){
				$('#editButtons').hide();
				$('#buttonPublishDoc').removeClass("hidden");
				$('#buttonPublishDoc').unbind("click");
				$('#buttonPublishDoc').click(function(){
					releaseDocument(hiddenDocument.id, hiddenDocument.fb)
				});
			}
			$("#editButton").unbind("click");
			$("#editButton").click(function(){
				editArbeit(function(){
					showHiddenDocument($_GET().id);
				})
			})
	}

	if (hiddenDocument != undefined)
	{
		var templateData = {
			"strTitle": settings.detailTableColumns[0][1],
			"strStudent": settings.detailTableColumns[1][1],
			"strFb": settings.detailTableColumns[2][1],
			"strLang": settings.detailTableColumns[3][1],
			"strType": settings.detailTableColumns[4][1],
			"strYear": settings.detailTableColumns[5][1],
			"strDocent": settings.detailTableColumns[6][1],
			"strCompany": settings.detailTableColumns[7][1],
			"strAbstract": settings.detailTableColumns[8][1],
			"strRestricted": settings.detailTableColumns[9][1],
			"restricted": (hiddenDocument.restricted === "1"),
			"restrictedVal": settings.yesno[hiddenDocument.restricted],
			"strFiles": "Datei(en)",
			"strSearchwords": "Schlagwörter",
			"document": hiddenDocument,
			"files": hiddenDocument.dateien,
			"editable": true
		}
		if (templates.show){
			initShowView()
		}
		else {
			loadMustacheTemplate("show", "tpl-show","partials/_show.html", initShowView);
		}
		$('#headLineStudiengang')[0].innerHTML = '<a onclick="changeFb(\'' + hiddenDocument.fb + '\');">' + hiddenDocument.fb + '</a> > ' + htmlEncode(hiddenDocument.title);
		$('#divTableOverview').hide();
	}
	else
	{
		changeFb();
	}
}

function releaseDocument(id, fb){
	var data =
	{
		action: "releasePrivateDocument",
		id: id,
		csrf_token: getCsrfToken()
	}
	$.post(settings.phpBackend, data)
	.always(function(data)
	{
		window.history.replaceState('', '', '?studiengang=' + fb + '&id=' + id);
		getDocumentById(id);
	});
}

// zählt den Counter für Downloads hoch
function downloadFile(id)
{
	var data =
	{
		action: 'incrementDownloads',
		id: id
	}
	$.post(settings.phpBackend, data)
	.always(function(data)
	{
		var idArray = $.inArray(id.toString(), arrayIdsArbeiten);
		arrayAllArbeiten[idArray].downloads = parseInt(arrayAllArbeiten[idArray].downloads)
		arrayAllArbeiten[idArray].downloads += 1;
		$('#downloadsValue')[0].innerHTML = arrayAllArbeiten[idArray].downloads;
	});
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

function getOptionsForSelectIndex(name){
	var options = settings.select[name];
	var oStr = ""
	for (var  i = 0; i < options.length; i++){
		oStr += '<option value="' + i + '">'+ options[i] +'</option>'
	}
	return oStr
}



// wechselt in den Bearbeitungsmodus
function editArbeit(hiddenDocument=false)
{
	getGetParas();
	if ($_GET().hidden){
		var selectedArbeit = getHiddenDocument($_GET().id);
		var newstate = '?edit&hidden&id=' + $_GET().id
		selectedArbeit.hidden = true
		window.history.pushState('', '', newstate);
		buildEditForm(selectedArbeit);
	}
	else {
		// var idArray = $.inArray($_GET().id.toString(), arrayIdsArbeiten);
		// var selectedArbeit = arrayAllArbeiten[idArray];
		var newstate = '?edit&id=' + $_GET().id
		//selectedArbeit.hidden = false
		window.history.pushState('', '', newstate);
		getSelectedDocument($_GET().id, buildEditForm)
	}
}

function buildEditForm(selectedDocument){
	var templateData = {
		"strTitle" : settings.detailTableColumns[0][1],
		"strStudent" : settings.detailTableColumns[1][1],
		"strFb" : settings.detailTableColumns[2][1],
		"strLang" : settings.detailTableColumns[3][1],
		"strType" : settings.detailTableColumns[4][1],
		"strYear" : settings.detailTableColumns[5][1],
		"strDocent" : settings.detailTableColumns[6][1],
		"strCompany" : settings.detailTableColumns[7][1],
		"abstract": selectedDocument.abstract,
		"strAbstract" : settings.detailTableColumns[8][1],
		"strRestricted": settings.detailTableColumns[9][1],
		"restricted": (selectedDocument.restricted === "1"),
		"strFiles" :"Datei(en)",
		"fbOptions": getOptionsForSelectIndex("fb"),
		"langOptions": getOptionsForSelectIndex("language"),
		"typeOptions": getOptionsForSelectIndex("type"),
		"files":edit.renderFiles(selectedDocument)
	}

	var onTemplateLoad = function(){
			$('#updateDocument').empty();
			$('#updateDocument').append(Mustache.render(templates.edit, templateData));
			initEditValues(selectedDocument);
			$('.editOnly').show();

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
			edit.displaySearchWords(selectedDocument.searchWords)
			$('#resetButton').unbind("click");
			if (selectedDocument.hidden){
				$('#resetButton').click(function(){
					showHiddenDocument(selectedDocument.id)
				});
			}
			else{
				$('#resetButton').click(function(){
					showDocument(selectedDocument.id)
				});
			}
			$('#saveButton').unbind("click");
			$("#saveButton").click(function(){
				saveDocument(selectedDocument.hidden)
			}
			);
	}
	if (templates.edit){
		onTemplateLoad()
	}
	else {
		loadMustacheTemplate("edit", "tpl-edit","partials/_edit_form.html", onTemplateLoad);
	}
}

function initEditValues(selectedDocument){
	for (var i = 0; i < arrayTableDetailledView.length; i++){
		var curProp = arrayTableDetailledView[i][0];
		if (settings.select[curProp]){
			if (curProp === "fb"){
				var val = selectedDocument[curProp]
			}
			else {
				var val = settings.select[curProp].indexOf(selectedDocument[curProp]);
			}
			$("select[name='" + arrayTableDetailledView[i][0] +"']").val(val);
		}
		else{
			$("input[name='" + arrayTableDetailledView[i][0] +"'][type!='checkbox']").val(selectedDocument[curProp])
		}
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
function resetDocument()
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


function saveDocument(hiddenDocument)
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
	if (hiddenDocument){
		showHiddenDocument($_GET().id)
	}
	else{
		currentDocument = null
		showDocument($_GET().id);
	}
	arraySearchwordOperations = [];
	return false;
}

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
			user.getCurrent();
			changeFb();
		});
		$.ajaxSetup({async: true});
	}
}

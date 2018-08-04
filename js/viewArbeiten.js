// globale Variablen
var arrayAllArbeiten = null;
var arrayIdsArbeiten = null;
var arraySelectedArbeiten = null;
var arrayTableSelectedArbeiten = null;
var arrayAllSearchWordsWithId = null;
// var ownUser = null;
var arrayTableDetailledView = settings.detailTableColumns;

$(document).ready(function() {
	// Navigation zwischen den Fachbereichen
	getAllArbeiten();
	getGetParas();
	prepareTableHeader();
	user.getCurrent();
	menu.init(user.current.UserRole);
	$('#editLink').click(changeToEdit);

	if ($_GET().edit)
	{
		// //$('#tableBodyDetailledArbeitEdit').hide();
		// $('#buttonEdit').hide();
		// //$(".logoutHidden").show();
		// $('#editLink').hide();
	}

	$('#tableOverview').DataTable
	(
		{
			"language":
			{
				"url": "js/dataTableGerman.json"
			}
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
		changeFachbereich($_GET().studiengang);
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
	changeFachbereich($_GET().studiengang);
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

	if ($_GET().edit)
	{
		strHtml += '<th><span class="glyphicon glyphicon-pencil"></span></th>';
	}

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

		if ($_GET().edit)
		{
			if (user.current.Id == arraySelectedArbeiten[key].userId || user.current.UserRole == '2') // verfügt der User über Bearbeitungsrecht?
			{
				arrayOneRow.push('<a onclick="showArbeitDetailled(' + arraySelectedArbeiten[key].Id + ');"><span class="glyphicon glyphicon-pencil"></span></a>');
			}
			else
			{
				arrayOneRow.push('');
			}
		}

		arrayTableSelectedArbeiten.push(arrayOneRow);

	}
	$('#tableOverview').DataTable().clear();
	$('#tableOverview').DataTable().rows.add(arrayTableSelectedArbeiten);
	$('#tableOverview').DataTable().draw();
}

// lädt alle Arbeiten aus der Datenbank
function getAllArbeiten()
{
	arrayIdsArbeiten = new Array();
	var data =
	{
		action: "getAllArbeiten"
	}
	$.ajaxSetup({async: false});
	$.post(settings.phpBackend, data)
	.always(function(data)
	{
		arrayAllArbeiten = data;
		for (var key in arrayAllArbeiten)
		{
			arrayIdsArbeiten.push(arrayAllArbeiten[key].Id);
		}
	});
	$.ajaxSetup({async: true});
	getAllSearchWordsWithId();
}

// gibt alle Schlagwörter aus
function getAllSearchWordsWithId()
{
	arrayAllSearchWordsWithId = new Array();
	var data =
	{
		action: "getAllSearchWordsWithId"
	}
	$.ajaxSetup({async: false});
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
				if (arrayAllSearchWordsWithId[keySearch].FileId == arrayAllArbeiten[keyArbeiten].Id.toString())
				{
					arraySearchWords.push(arrayAllSearchWordsWithId[keySearch].Word);
				}
			}
			arrayAllArbeiten[keyArbeiten]['searchWords'] = arraySearchWords;
		}
	});
	$.ajaxSetup({async: true});
}

function changeToEdit(event){
	event.preventDefault();
	var studiengang = window.location.search.match(/studiengang=\w*/);
	var newstate = "?edit"
	if (studiengang && studiengang.length > 0) {
		newstate += "&" + studiengang[0];
	}
	window.history.pushState('', '', newstate);
	getGetParas();
	prepareTableHeader();
	reloadDataTable();
}


// wird beim Wechsel des Fachbereichs Aufgerufen
function changeFachbereich(selectedStudiengang)
{
	arraySelectedArbeiten = new Array();
	selectedStudiengang = selectedStudiengang || '';
	selectedStudiengang = selectedStudiengang.trim();
	for (var key in arrayAllArbeiten)
	{
		if (arrayAllArbeiten[key].studiengang == selectedStudiengang || '' == selectedStudiengang || undefined == selectedStudiengang)
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
		//window.history.replaceState('', '', '?edit&studiengang=' + selectedStudiengang);
	 window.history.pushState('', '', '?edit&studiengang=' + selectedStudiengang);
	}
	else
	{
		//window.history.replaceState('', '', '?studiengang=' + selectedStudiengang);
		window.history.pushState('', '', '?studiengang=' + selectedStudiengang);
	}
	resetArbeit();
	$('.active_fb').removeClass('active_fb');

	if ( selectedStudiengang && selectedStudiengang.length > 0){
		$('li:contains("'+selectedStudiengang +'")').addClass('active_fb');
	}
	$('#editButtons').hide();
	$('.editOnly').hide();
}

function getSearchwordLabel(content, value, labelClass="default", additionalAttr=""){
	return '<span value="'+value+'"class="label label-'+labelClass+'"'+ additionalAttr +'>' + content + '</span> '
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
		strHtml += '<a target="_blank" href="upload/' + selectedArbeit.Id + '/' + selectedFile + '" onclick="downloadFile(' + selectedArbeit.Id + ');">';
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
		strHtml += '<div><a target="_blank" href="upload/' + selectedArbeit.Id+ '/' + selectedFile + '">';
		if (selectedFile.substr(selectedFile.length - 4, 4) == '.pdf')
		{
			strHtml += '<img src="img/pdf.png">';
		}
		strHtml += selectedFile + '</a><span class="glyphicon glyphicon-trash" onclick="deleteFile($(this),'+selectedArbeit.Id+')"></span></div>';
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
				'<td>' + selectedArbeit[arrayTableDetailledView[subArray][0]] + '</td>' +
			'</tr>';
	}
	if (user.current.UserRole == 2 || user.current.Id == selectedArbeit.userId)
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

// detaillierte Übersicht über eine Arbeit
function showArbeitDetailled(Id)
{
	var idArray = $.inArray(Id.toString(), arrayIdsArbeiten);
	var selectedArbeit = arrayAllArbeiten[idArray];
	if (selectedArbeit != undefined)
	{
		$('#tableBodyDetailledArbeit')[0].innerHTML = getArbeitTableHTML(selectedArbeit);
		$('#headLineStudiengang')[0].innerHTML = '<a onclick="changeFachbereich(\'' + selectedArbeit.studiengang + '\');">' + selectedArbeit.studiengang + '</a> > ' + selectedArbeit.titel;
		$('#arbeitSearchwords')[0].innerHTML = renderSearchwords(selectedArbeit)
		$('#divTableOverview').hide();
		$('#tableDetailledArbeit').show();
		$('#arbeitSearchwords').show()
		if ($_GET().edit)
		{
			window.history.replaceState('', '', '?edit&studiengang=' + selectedArbeit.studiengang + '&id=' + selectedArbeit.Id);
			if (user.current.Id == selectedArbeit.userId || user.current.UserRole == '2')
			{
				$('#editButtons').show();
			}
			else
			{
				$('#editButtons').hide();
			}
			$('.editOnly').hide();
		}
		else
		{
			$('.editOnly').hide();
			$('#editButtons').hide();
			window.history.replaceState('', '', '?studiengang=' + selectedArbeit.studiengang + '&id=' + selectedArbeit.Id);
		}
	}
	else
	{
		changeFachbereich();
	}
}

function showHiddenArbeit(id){
	arrayIdsArbeiten = new Array();
	var hiddenArbeit;
	var role;
	var data =
	{
		action: "getPrivateArbeit",
		id: id
	}
	$.ajaxSetup({async: false});
	$.post(settings.phpBackend, data)
	.always(function(data)
	{
		if (data[0] > 0 ){
			role = data[0];
			hiddenArbeit = data[1];
		}
		else{
			changeFachbereich();
		}
	});
	$.ajaxSetup({async: true});
	if (hiddenArbeit){
		$('#tableBodyDetailledArbeit')[0].innerHTML = getArbeitTableHTML(hiddenArbeit);
		$('#divTableOverview').hide();
		$('#tableDetailledArbeit').show();
		if (role == 2){
			$('.editOnly').hide();
			$('#editButtons').hide();
			$('#buttonPublishDoc').removeClass("hidden");
			$('#buttonPublishDoc').click(function(){releaseDocument(hiddenArbeit.Id, hiddenArbeit.studiengang)});//'releaseDocument('+ hiddenArbeit.Id+','+hiddenArbeit.studiengang')';
		}
	}
}

function releaseDocument(id, studiengang){
	var data =
	{
		action: "releasePrivateDocument",
		id: id
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
	var idArray = $.inArray($_GET().id.toString(), arrayIdsArbeiten);
	var selectedArbeit = arrayAllArbeiten[idArray];
	var cuttedArrayTableDetailledView = arrayTableDetailledView.slice(0, -1);
	var arrayTableEdit =
	[
		'<input class="form-control" id ="' + arrayTableDetailledView[0][0] + '" name="' + arrayTableDetailledView[0][0] + '" value="' + selectedArbeit[arrayTableDetailledView[0][0]] + '" required />',
		'<input class="form-control" id ="' + arrayTableDetailledView[1][0] + '" name="' + arrayTableDetailledView[1][0] + '" value="' + selectedArbeit[arrayTableDetailledView[1][0]] + '" required />',
		'<select class="form-control" id="studiengang" name="studiengang" required>' +
			getOptionsForSelect("studiengang") +
		'</select>',

		'<select class="form-control" id="language" name="language" required>' +
			getOptionsForSelect("sprache") +
		'</select>',

		'<select class="form-control" id="artOfArbeit" name="artOfArbeit" required>' +
				getOptionsForSelect("typ") +
		'</select>',

		'<input class="form-control" id ="' + arrayTableDetailledView[5][0] + '" name="' + arrayTableDetailledView[5][0] + '" value="' + selectedArbeit[arrayTableDetailledView[5][0]] + '" required pattern="[0-9]{4}" />',
		'<input class="form-control" id ="' + arrayTableDetailledView[6][0] + '" name="' + arrayTableDetailledView[6][0] + '" value="' + selectedArbeit[arrayTableDetailledView[6][0]] + '" required />',
		'<input class="form-control" id ="' + arrayTableDetailledView[7][0] + '" name="' + arrayTableDetailledView[7][0] + '" value="' + selectedArbeit[arrayTableDetailledView[7][0]] + '" required />'
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
			'<input id="input-b2" name="input-b2" type="file" class="file" data-show-preview="false">' +
			'</td>' +
		'</tr>';

	$('#tableBodyDetailledArbeitEdit')[0].innerHTML = strHtml;
	$('#studiengang')[0].value = selectedArbeit[arrayTableDetailledView[2][0]];
	$('#language')[0].value = selectedArbeit[arrayTableDetailledView[3][0]];
	$('#artOfArbeit')[0].value = selectedArbeit[arrayTableDetailledView[4][0]];
	$('#tableBodyDetailledArbeit').hide();
	$('#tableBodyDetailledArbeitEdit').show();
	$('#editButtons').hide();
	$('.editOnly').show	();
	$("#input-b2").fileinput()
	edit.displaySearchWords(selectedArbeit.searchWords)//displaySearchWordsEdit(selectedArbeit.searchWords);
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
	innerHTML = text + '</a><span class="glyphicon glyphicon-repeat" onclick="rmFileDeleteRequest($(this),'+id+')"></span>';
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

// speichert die Arbeit
function saveArbeit()
{
	getGetParas();
	var addSW = [];
	var delSW = [];
	var delFiles = [];
	$(".addSW").each(function (idx,elem){
	 	var value = $(elem).attr("value");
		if (value){
			addSW.push(value.trim());
		}
	});
	$(".delSW").each(function (idx, elem){
		var value = $(elem).attr("value");
		if (value){
			delSW.push(value.trim());
		}
	});
	$(".delFile").each(function(idx, elem){
		delFiles.push(elem.textContent);
	})

	var data = $('#formSaveArbeit').serialize();
	data += '&action=formSaveArbeit&id=' + $_GET().id +
					"&deleteSW="+JSON.stringify(delSW)+
					"&addSW="+JSON.stringify(addSW);
	data += '&delFiles='+JSON.stringify(delFiles);
	$.ajaxSetup({async: false});
	$.post(settings.phpBackend, data);
	$.ajaxSetup({async: true});
	resetArbeit();
	getAllArbeiten();
	user.getCurrent();
	showArbeitDetailled($_GET().id);
	arraySearchwordOperations = [];
	return false;
}

// löscht eine Arbeit vollständig
function deleteArbeit()
{
	if (confirm('Möchten Sie diese Arbeit wirklich löschen?'))
	{
		getGetParas();
		var idArray = $.inArray($_GET().id.toString(), arrayIdsArbeiten);
		var id = arrayAllArbeiten[idArray].Id;
		var data =
		{
			action: "deleteArbeit",
			id: id
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
			getAllArbeiten();
			user.getCurrent();
			changeFachbereich();
		});
		$.ajaxSetup({async: true});
	}
}

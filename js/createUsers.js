
$(document).ready(function() {
  $('[data-toggle="tooltip"]').tooltip();
  prepareTableHeader();
  $('#tableExistingUsers').DataTable();
  reloadUserTable();
  setDateDefault();
  $("#formCreateUsers").submit(function(event){createUser(event)});
	$('#formUser-divError').hide();
});

function prepareTableHeader()
{
	var strHtml =
		'<tr>' +
			'<th>Kürzel</th>' +
      '<th>Erstellte Arbeiten </th>' +
			'<th>Gültig bis:</th>' +
      '<th><span class="glyphicon glyphicon-pencil"></span></th>'+
      '<th><span class="glyphicon glyphicon-trash"></span></th>'+
    '</tr>';
    $('#tableHeader')[0].innerHTML = strHtml;
}

function reloadUserTable(){
  var arrayTableCreatedUsers = new Array();
  var userDataTable = $('#tableExistingUsers');
  var createdUsers = getAllCreatedUsers();
  for (var key in createdUsers)
	{
		var arrayOneRow = new Array();
		arrayOneRow.push(createdUsers[key].UserName);
    arrayOneRow.push(getReleasableFilesHtml(createdUsers[key].releaseRequests));
		arrayOneRow.push(createdUsers[key].ExpiryDate);
    var deleteButton = "<button class='btn btn-danger' onclick='deleteUserAccount("+createdUsers[key].Id + ")'>Löschen</button>";
    var refreshButton = "<button onclick='openUserRefreshForm(\""+createdUsers[key].UserName + "\", "+ createdUsers[key].Id + ",\""+createdUsers[key].ExpiryDate + "\")'>Verlängern</button>";
		arrayOneRow.push(refreshButton);
		arrayOneRow.push(deleteButton);
    arrayTableCreatedUsers.push(arrayOneRow);
  }

  userDataTable.DataTable().clear();
  userDataTable.DataTable().rows.add(arrayTableCreatedUsers);
  userDataTable.DataTable().draw();
}

function getReleasableFilesHtml(releaseRequests){
  var strHtml = "";
  for (var i = 0; i < releaseRequests.length; i++){
    strHtml += "<a href='/?hidden&id=" + releaseRequests[i][0] + "'>";
    strHtml +=  releaseRequests[i][1] + '</a> <br>';
  }
  return strHtml;
}

function seeHiddenDoc(id){
  window.history.replaceState('', '', '?hidden&id=' + id);
}


function sendFormData(data){
  var returnValue = false;
  $.ajaxSetup({async: false});
  $.post("php/manageBackend.php", data)
  .always(function(data)
  {
    console.log(data);
    tmpId = data[0];
    if (tmpId >= 1)
    {
      $('#formUser-divError').hide();
      $('#formUser-divSuccess').show();
      $('#formUser-divSuccess')[0].innerHTML = data[1];
      returnValue = true;
    }
    else
    {
      $('#formUser-divSuccess').hide();
      $('#formUser-divError').show();
      if (data[0] == 0)
      {
        $('#formUser-divError')[0].innerHTML = data[1];
      }
      else if (data[0] == -1){
        location.reload();
      }
      else
      {
        $('#formUser-divError')[0].innerHTML = '<b>Fehler!</b> Datenbank ist nicht erreichbar.';
      }
    }
  });
  $.ajaxSetup({async: true});
  return returnValue;
}

function createUser(event){
  event.preventDefault();
  var data = $('#formCreateUsers').serialize();
  data += '&action=formCreateUsers';
  returnValue = sendFormData(data);
  if (returnValue){
    reloadUserTable();
    resetUserFormFields();
  }
  return false;
}

function updateUser(event, id){
  event.preventDefault();
  var returnValue = false;
  var data = $('#formCreateUsers').serialize();
  data += '&action=formUpdateUsers&id=' + id;;
  returnValue = sendFormData(data);
  if (returnValue){
    reloadUserTable();
    resetUserFormFields();
  }
  return false;
}

function getAllCreatedUsers()
{
  var createdUsers = null;
	var data =
	{
		action: "getCreatedUsers"
  }
  ;
	$.ajaxSetup({async: false});
	$.post("php/manageBackend.php", data)
	.always(function(r_data)
	{
    console.log(r_data);;
		createdUsers = r_data;
	});
	$.ajaxSetup({async: true});
  return createdUsers;
}

function deleteUserAccount(id)
{
  if (confirm("Möchten Sie wirklich diesen Account löschen? Arbeiten, die von diesem Account erstellt wurden und noch nicht freigegeben wurden, werden dabei gelöscht.")){
  	var data =
  	{
  		action: "deleteStudentAccount",
      id: id
    }
    ;
  	$.ajaxSetup({async: false});
  	$.post("php/manageBackend.php", data)
  	.always(function(data)
  	{
      console.log(data);
  	});
  	$.ajaxSetup({async: true});
    getAllCreatedUsers();
    reloadUserTable();
  }
}

function setDateDefault(){
  dateInput = $("#datum_gueltig")[0];
  defaultDate = new Date();
  dateInput.min = defaultDate.toISOString().substr(0,10);;
  defaultDate.setDate(defaultDate.getDate() + 7);
  dateStr = defaultDate.toISOString().substr(0,10);
  dateInput.value = dateStr;
  dateInput.max = dateStr;
}

function setExpiryFieldsForUpdateForm(expiry){
  expiryArr = expiry.split(" ");
  $("#time_gueltig").val(expiryArr[1].substr(0,5));
  $("#datum_gueltig").prop("min",expiryArr[0]);
}

function openUserRefreshForm(name,id, expiry){
  //Scrolling Trick von https://stackoverflow.com/questions/8884230/jquery-move-to-anchor-location-on-page-load/8884286#8884286
  $(document).scrollTop( $("#formCreateUsers").offset().top );

  $('#formUser-divSuccess, #formUser-divError').hide();
  $("#formCreateUsers").unbind( "submit" );
  $("#formCreateUsers").submit(function(event){updateUser(event, id)});

  $("#userFormTitle").text("Account verlängern");
  $("#username").val(name);
  $("#username").prop("disabled", true);
  $("#formCreateUsers :submit" ).text("Account verlängern")
  setExpiryFieldsForUpdateForm(expiry);

  $("#cancelRefresh").show();
}

function resetUserFormFields(){
  $("#userFormTitle").text("Temporären Studenten-Account erstellen");
  $("#formCreateUsers").unbind( "submit" );
  $("#formCreateUsers").submit(function(event){createUser(event)});
  $("#username").val("");
  $("#username").prop("disabled", false);
  $("#formCreateUsers :submit" ).text("Zugang erstellen");
  setDateDefault();
  $("#cancelRefresh").hide();
}

function resetUserForm(){
  $('#formUser-divSuccess, #formUser-divError').hide();
  resetUserFormFields();
}

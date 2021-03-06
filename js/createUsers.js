
var userTable;

$(document).ready(function() {
  $('[data-toggle="tooltip"]').tooltip();
  //prepareTableHeader();
  userTable = $('#tableExistingUsers').DataTable(
  		{
  			"language":
  			{
  				"url": "js/dataTableGerman.json"
  			},
        "ajax": "/php/table.php?action=createdUsers",
  			"columnDefs": [
          {
            "targets": 1,
            "render": function(data, type, row){
              return getReleasableFilesHtml(data);
            },
          },
          {
            "targets": 2,
            "render": function(data){
              return (new Date(data)).toLocaleString()
            }
          },
          {
            "targets": 3,
            "render": function(data, type, row){
              return "<button onclick='openUserRefreshForm(\""+row[0] + "\", "+ data + ",\""+row[2] + "\")'>Verlängern</button>";
            },
          },
  				{
  						"targets": 4,
  						"render": function(data, type, row, meta){
                  // if(type === 'display'){
                    return "<button class='btn btn-danger' onclick='deleteUserAccount("+row[3]+ ")'>Löschen</button>";
                  // }
              }
          },
  				{
  					"targets": '_all',
  					"render": $.fn.dataTable.render.text(),
            "sortable": true
  				}
  			]
  		}
  	);
//reloadUserTable();
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
		arrayOneRow.push(createdUsers[key].user_name);
    arrayOneRow.push(getReleasableFilesHtml(createdUsers[key].release_requests));
		arrayOneRow.push(createdUsers[key].expiry_date);
    var deleteButton = "<button class='btn btn-danger' onclick='deleteUserAccount("+createdUsers[key].id + ")'>Löschen</button>";
    var refreshButton = "<button onclick='openUserRefreshForm(\""+createdUsers[key].user_name + "\", "+ createdUsers[key].id + ",\""+createdUsers[key].expiry_date + "\")'>Verlängern</button>";
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
    strHtml +=  htmlEncode(releaseRequests[i][1]) + '</a> <br>';
  }
  return strHtml;
}

function seeHiddenDoc(id){
  window.history.replaceState('', '', '?hidden&id=' + id);
}

function getCsrfToken(){
	return $("#csrf_token").val();
}

function sendFormData(data, onSuccess){
  var returnValue = false;
  $.post("php/manageBackend.php", data)
  .always(function(data)
  {
    tmpId = data[0];
    if (tmpId >= 1)
    {
      $('#formUser-divError').hide();
      $('#formUser-divSuccess').show();
      $('#formUser-divSuccess')[0].innerHTML = data[1];
      onSuccess()
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
  return returnValue;
}

function createUser(event){
  event.preventDefault();
  var data = $('#formCreateUsers').serialize();
  data += "&csrf_token=" + getCsrfToken();
  data += '&action=formCreateUsers';
  onSuccess = function(){
    // reloadUserTable();
    userTable.ajax.reload()
    resetUserFormFields();
  }
  sendFormData(data, onSuccess);
  return false;
}

function updateUser(event, id){
  event.preventDefault();
  var returnValue = false;
  var data = $('#formCreateUsers').serialize();
  data += "&csrf_token=" + getCsrfToken();
  data += '&action=formUpdateUsers&id=' + id;;
  onSuccess = function(){
    // reloadUserTable();
    userTable.ajax.reload()
    resetUserFormFields();
  }
  sendFormData(data, onSuccess);
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
	$.post("php/manageBackend.php", data)
	.always(function(r_data)
	{
    console.log(r_data);
		createdUsers = r_data;
    return createdUsers;
	});
}

function deleteUserAccount(id)
{
  if (confirm("Möchten Sie wirklich diesen Account löschen? Arbeiten, die von diesem Account erstellt wurden und noch nicht freigegeben wurden, werden dabei gelöscht.")){
  	var data =
  	{
  		action: "deleteStudentAccount",
      id: id,
      csrf_token: getCsrfToken()
    }
    ;
  	$.post("php/manageBackend.php", data)
  	.always(function(data)
  	{
      getAllCreatedUsers();
      userTable.ajax.reload()
  	});
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

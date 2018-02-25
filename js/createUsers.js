var createdUsers = null;

$(document).ready(function() {
  $('[data-toggle="tooltip"]').tooltip();
  prepareTableHeader();
  getAllCreatedUsers();
  $('#tableExistingUsers').DataTable();
  reloadUserTable();
  setDateDefault();
	$('#formUser-divError').hide();
});

function prepareTableHeader()
{
	var strHtml =
		'<tr>' +
			'<th>Kürzel</th>' +
			'<th>Gültig bis:</th>' +
      '<th><span class="glyphicon glyphicon-pencil"></span></th>'+
      '<th><span class="glyphicon glyphicon-trash"></span></th>'+
    '</tr>';
    $('#tableHeader')[0].innerHTML = strHtml;
}

function reloadUserTable(){
  arrayTableCreatedUsers = new Array();
  userDataTable = $('#tableExistingUsers');
  for (var key in createdUsers)
	{
		var arrayOneRow = new Array();
		arrayOneRow.push(createdUsers[key].UserName);
		arrayOneRow.push(createdUsers[key].ExpiryDate);
    var deleteButton = "<button class='btn btn-danger' onclick='deleteAccount("+createdUsers[key].Id + ")'>Löschen</button>";
    var refreshButton = "<button onclick='refreshAccount("+createdUsers[key].Id + ")'>Verlängern</button>";
		arrayOneRow.push(refreshButton);
		arrayOneRow.push(deleteButton);
    arrayTableCreatedUsers.push(arrayOneRow);
    console.log(arrayTableCreatedUsers);
  }

  userDataTable.DataTable().clear();
  userDataTable.DataTable().rows.add(arrayTableCreatedUsers);
  userDataTable.DataTable().draw();
}

function createUser(){
  var returnValue = false;
  var data = $('#formCreateUsers').serialize();
  data += '&action=formCreateUsers';
  $.ajaxSetup({async: false});
  $.post("php/manageBackend.php", data)
  .always(function(data)
  {
    tmpId = data[0];
    if (tmpId >= 1)
    {
      $('#formLogin-divError').hide();
      returnValue = true;
    }
    else
    {
      $('#formUser-divError').show();
      if (data[0] == 0)
      {
        $('#formUser-divError')[0].innerHTML = data[1];
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

function getAllCreatedUsers()
{
	var data =
	{
		action: "getCreatedUsers"
  }
  ;
	$.ajaxSetup({async: false});
	$.post("php/manageBackend.php", data)
	.always(function(data)
	{
		createdUsers = data;
	});
	$.ajaxSetup({async: true});
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

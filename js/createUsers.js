

$(document).ready(function() {
  setDateDefault();
	$('#formUser-divError').hide();
});

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


function setDateDefault(){
  dateInput = $("#datum_gueltig")[0];
  defaultDate = new Date();
  dateInput.min = defaultDate.toISOString().substr(0,10);;
  defaultDate.setDate(defaultDate.getDate() + 7);
  dateStr = defaultDate.toISOString().substr(0,10);
  dateInput.value = dateStr;
  dateInput.max = dateStr;
}



function createUser(){
  returnvalue = false;
  var data = $('#formCreateUsers').serialize();
  console.log(data);
  data += '&action=formCreateUsers';
  console.log(data);
  $.ajaxSetup({async: false});
  $.post("php/manageBackend.php", data)
  .always(function(data)
  {
    tmpId = data[0];
  });
  $.ajaxSetup({async: true});
}

<?php
if ( 0 < $_FILES['file']['error'] )
{
    echo 'Error: ' . $_FILES['file']['error'] . '<br>';
}
else
{
    move_uploaded_file($_FILES['file']['tmp_name'], '../upload/test/' . $_FILES['file']['name']);
}
print_r($_FILES);
echo $_REQUEST['id'];
?>
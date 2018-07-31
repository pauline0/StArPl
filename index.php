<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL | E_STRICT );
session_start();
if (isset($_REQUEST['edit']))
{
    if (isset($_SESSION['StArPl_Id']) && isset($_REQUEST['logout']))
    {
        logout();
    }
    if (isset($_SESSION['StArPl_Id']) && !isset($_REQUEST['logout']))
    {
        include_once('html/viewArbeiten.html');
    }
    else
    {
        include_once('html/login.html');
    }
}
else if (isset($_REQUEST['upload']))
{
    if (isset($_SESSION['StArPl_Id']) && isset($_REQUEST['logout']))
    {
        logout();
    }
    else if (isset($_SESSION['StArPl_Id']) && !isset($_REQUEST['logout']))
    {
        include_once('html/upload.html');
    }
    else
    {
        include_once('html/login.html');
    }
}
else if (isset($_REQUEST['create'])){
  if (isset($_SESSION['StArPl_Id']) && isset($_REQUEST['logout'])){
    logout();
  }
  else if (isset($_SESSION['StArPl_Id']) && !isset($_REQUEST['logout']))
  {
    if ($_SESSION["StArPl_UserRole"] > 0) {
      include_once('html/create-new-tempuser.html');
    }
    else{
      header("Location: /");
      die();
    }
  }
  else
  {
      include_once('html/login.html');
  }

}
else
{
    if (isset($_SESSION['StArPl_Id']) && isset($_REQUEST['logout']))
    {
        logout();
    }
    else
    {
        include_once('html/viewArbeiten.html');
    }
}

// regelt logout
function logout()
{
	if (isset($_SESSION['StArPl_session']))
	{
		$session = $_SESSION['StArPl_session'];
		$url = 'https://webmail.stud.hwr-berlin.de/ajax/login?action=logout';
		$post = "session=$session";
		fireCURL($url, $post);
	}
    unset($_SESSION['StArPl_Id']);
    unset($_SESSION['StArPl_UserRole']);
    unset($_SESSION['StArPl_session']);
    header('location: .');
}

// benötigt, um header-Problem mit jQuery.post() zu umgehen
// ebenfalls in manageBackend.php vorhanden
function fireCURL($url, $post)
{
	$curl = curl_init();
	curl_setopt($curl, CURLOPT_URL, $url);
	curl_setopt($curl, CURLOPT_POST, true);
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($curl, CURLOPT_POSTFIELDS, $post);
	$response = curl_exec($curl);
	curl_close($curl);
	return $response;
}
?>

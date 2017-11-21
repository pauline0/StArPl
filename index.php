<?php
session_start();
if (isset($_REQUEST['edit']))
{
    if (isset($_SESSION['StArPl_Id']) && !isset($_REQUEST['logout']))
    {
        include_once('html/viewArbeiten.html');
    }
    else
    {
        logout();
    }
}
else if (isset($_REQUEST['upload']))
{
    if (isset($_SESSION['StArPl_Id']) && !isset($_REQUEST['logout']))
    {
        include_once('html/upload.html');
    }
    else
    {
        logout();
    }
}
else
{
    include_once('html/viewArbeiten.html');
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
    include_once('html/login.html');
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
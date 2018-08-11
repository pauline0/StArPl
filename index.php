<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL|E_STRICT );
include_once('php/lib_auth.inc.php');
include_once('php/lib_common.inc.php');
session_start();
error_log(var_dump($_SESSION));
if (isset($_GET["action"]) && $_GET["action"] == "login"){
  $block_students = true;
  if ($_POST["FORM_LOGIN_NAME"] !== "student"){
    if (substr($_POST["FORM_LOGIN_NAME"],0,2) === "s_"){
      $user_id = find_temporary_user_in_db($_POST["FORM_LOGIN_NAME"]);
      if ($user_id){
        //now you can use a student account
        $block_students = false;
      }
      else{
        add_loginError("Bitte wende dich an einen Dozenten.");
      }
    }
    $_SESSION["starpl"]["user_name"] = $_POST["FORM_LOGIN_NAME"];
  }
  else {
    add_loginError("Dieser Account kann nicht genutzt werden.");
  }
  authenticate($block_students, "login.php", "index.php");
}
else {
  if(isset($_GET["action"]) && $_GET["action"] == "init"){
    if((isset($_SESSION["user"]) && $_SESSION["user"] !== "anonymous") && !isset($_SESSION["starpl"]["user_id"])){
      if (isset($_SESSION["starpl"]["user_name"])){
        if (substr($_SESSION["starpl"]["user_name"], 0, 2) === 's_'){
          $user_id = find_temporary_user_in_db($_SESSION["starpl"]["user_name"]);
          if ($user_id){
            $_SESSION["starpl"]["user_id"] = $user_id;
            $_SESSION["starpl"]["user_rolle"] = $ROLLE_STUDENT;
          }
          else {
            reset_authentification();
            authenticate();
          }
        }
        else{
          list($user_id, $user_role) = find_user_in_db($_SESSION["starpl"]["user_name"]);
          if (!$user_id){
            $user_id = create_user_in_db($_SESSION["starpl"]["user_name"], 1);
            $user_role = 1;
          }
          $_SESSION["starpl"]["user_id"] = $user_id;
          $_SESSION["starpl"]["user_role"] = $user_role;
        }
      }
    }
  }
  if (isset($_REQUEST['edit']))
  {
    authenticate_starpl("html/viewArbeiten.html","/?edit&", 1 );
  }
  else if (isset($_REQUEST['upload']))
  {
    authenticate_starpl("html/upload.html","/?upload&", 1 );
  }
  else if (isset($_REQUEST['create'])){
    authenticate_starpl("html/create-new-tempuser.html","/?create&", 1 );
  }
  else
  {
      if (isset($_SESSION["starpl"]["user_id"]) && isset($_REQUEST['logout']))
      {
          logout();
      }
      else
      {
          include_once('html/viewArbeiten.html');
      }
  }
}

function authenticate_starpl($html_file, $success_url, $minlevel){
  // User is logged in, but StArPl session variables are not set
  if((isset($_SESSION["user"]) && $_SESSION["user"] !== "anonymous") && !isset($_SESSION["starpl"]["user_id"])){
    if (isset($_SESSION["starpl"]["user_name"])){
      if (substr($_SESSION["starpl"]["user_name"], 0, 2) === 's_'){
        $user_id = find_temporary_user_in_db($_SESSION["starpl"]["user_name"]);
        if ($user_id){
          $_SESSION["starpl"]["user_id"] = $user_id;
          $_SESSION["starpl"]["user_rolle"] = 0;
        }
        else {
          reset_authentification();
        }
      }
      else{
        list($user_id, $user_role) = find_user_in_db($_SESSION["starpl"]["user_name"]);
        if (!$user_id){
          $user_id = create_user_in_db($_SESSION["starpl"]["user_name"], 1);
          $user_role = 1;
        }
        $_SESSION["starpl"]["user_id"] = $user_id;
        $_SESSION["starpl"]["user_role"] = $user_role;
      }
    }
  }
  if (isset($_SESSION["starpl"]["user_id"]) && $_SESSION["starpl"]["user_role"] >= $minlevel){
    include_once($html_file);
  }
  else {
    authenticate(false, "/login.php", $success_url."action=init" );
  }
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

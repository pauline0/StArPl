<?php
include_once('config.php');

$ROLLE_STUDENT=0;
$ROLLE_DOZENT=1;
$ROLLE_ADMIN=2;
//$conn = connect_to_db();

function connect_to_db(){
  $server = "localhost";
  $database = "starpl";
  $username = "starpl";
  $password = "starpl";
  return new mysqli($server, $username, $password, $database);
}

function find_user_in_db($user_name)
{
  $conn = connect_to_db();
  $query = "SELECT Id, UserRole FROM userLogin WHERE UserName=?;";
  $stmt = $conn->prepare($query);
  $stmt->bind_param("s", $user_name);
  $stmt->execute();
  $stmt->bind_result($user_id, $user_role);
  if ($stmt->fetch()){
    $stmt->free_result();
    $stmt->close();
    return array($user_id, $user_role);
  }
  else {
    $stmt->close();
    return null;
  }
}

function create_user_in_db($user_name, $user_role)
{
  $conn = connect_to_db();
  $query = "INSERT INTO userLogin (UserName, UserRole) VALUES (?,?);";
  $stmt = $conn->prepare($query);
  $stmt->bind_param("si", $user_name, $user_role);
  $stmt->execute();
  $stmt->close();
  return $conn->insert_id;
}

function find_temporary_user_in_db($user_name){
  global $conn;//$conn = connect_to_db();

  $query = "SELECT userLogin.Id , ExpiryDate, (`ExpiryDate` > NOW()) AS Valid FROM userLogin LEFT JOIN studentAccounts ON userLogin.Id = studentAccounts.UserId WHERE UserName=?";
  $stmt = $conn->prepare($query);
  $stmt->bind_param("s", $user_name);
  $stmt->execute();
  $stmt->bind_result($id, $expiry, $valid);
  while (mysqli_stmt_fetch($stmt)) {
    // if (!$expiry){
    //
    // }
    if($valid){
      $user_id = $id;
      break;
    }
  }
  $stmt->close();
  $user_id?:null;
  return $user_id;
}

function reset_authentification(){
  unset($_SESSION["starpl"]);
}

function get_user_role(){

}
//https://funcptr.net/2013/08/25/user-sessions,-what-data-should-be-stored-where-/
function check_user_level($user_id, $level,$op=">="){
  global $conn;//$conn = connect_to_db();
  // $conn = connect_to_db();
  $query = "SELECT * FROM userLogin WHERE Id=? AND (UserRole ".$op." $level)";
  $stmt = $conn->prepare($query);
  $stmt->bind_param("i", $user_id);
  $stmt->execute();
  if($stmt->fetch()){
    $stmt->free_result();
    $stmt->close();
    return true;
  }
  else{
    $stmt->close();
    return false;
  }
}

function check_if_min_dozent($user_id){
  global $ROLLE_DOZENT;
  //return (isset($_SESSION["starpl"]["user_role"]) && $_SESSION["starpl"]["user_role"] > $ROLLE_DOZENT);
  return (isset($user_id) && check_user_level($user_id, $ROLLE_DOZENT));
}

function check_if_min_admin($user_id){
  global $ROLLE_ADMIN;
  return (isset($user_id) && check_user_level($user_id, $ROLLE_ADMIN));
}

function check_if_min_student($user_id){
  global $ROLLE_STUDENT;
  return (isset($user_id) && check_user_level($user_id, $ROLLE_STUDENT));
}

function check_if_logged_in(){
  return (isset($_SESSION["starpl"]["user_id"]));
}

function check_if_csrf(){
  if (isset($_SESSION["csrf_token"]) && ((isset($_POST["csrf_token"]) && $_POST["csrf_token"] == $_SESSION["csrf_token"]) || (isset($_GET["csrf_token"]) && $_GET["csrf_token"] == $_SESSION["csrf_token"])))
  {
      error_log("success");
      $_SESSION["csrf_detected"] = false;
  }
  else
  {
      error_log("no_success");
      $_SESSION["csrf_detected"] = true;
  }
}

function set_csrf_token(){
  $csrf_token = md5(uniqid(rand(), true));
  $_SESSION["csrf_token"] = $csrf_token;
}

function sanitize_input_data($data){

}
?>

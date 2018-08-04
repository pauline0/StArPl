<?php
include_once('config.php');

$ROLLE_STUDENT=0;
$ROLLE_DOZENT=1;
$ROLLE_ADMIN=2;


function connect_to_db(){
  $server = "localhost";
  $database = "starpl";
  $username = "starpl";
  $password = "starpl";
  return new mysqli($server, $username, $password, $database);
}

function find_user_in_db($user_name)
{
	$user_id = 0;
  $query = "SELECT Id, UserRole FROM userLogin WHERE UserName=?";
  $stmt = $conn->prepare($query);
  $stmt->bind_param("s", $user_name);
  $stmt->execute();
  $stmt->bind_result($user_id, $user_role);
  $stmt->close();
  return array($user_id, $user_role) ;
}

function create_user_in_db($user_name, $user_role)
{

  $query = "INSERT INTO userLogin (UserName, UserRole) VALUES (?,?);";
  $stmt = $conn->prepare($query);
  $stmt->bind_param("si", $user_name, $user_role);
  $stmt->execute();
  $stmt->close();
  return $conn->insert_id();
}

function find_temporary_user_in_db($user_name){
  $conn = connect_to_db();
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
  return $user_id;
}




	// $result = $conn->query("SELECT `Id` FROM `userLogin` WHERE `UserName`='$userName';");
	// while ($zeile = $result->fetch_assoc())
	// {
	// 	$userId = $zeile['Id'];
	// }
	// return $userId;
?>

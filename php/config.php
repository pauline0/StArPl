<?php
error_reporting(-1);
ini_set("error_log", "/tmp/php-error.log");
error_log( "Hello, errors!" );
$server = "localhost";
$database = "starpl2";
$username = "starpl";
$password = "starpl";
$conn = new mysqli($server, $username, $password, $database);

if (mysqli_connect_errno())
{
  echo "Failed to connect to MySQL: " . mysqli_connect_error();
}
// 
// if (!$conn->set_charset('utf8')) {
//     error_log("Error loading character set utf8: %s\n", $conn->error);
//     exit;
// }

$ROLLE_STUDENT = 0;
$ROLLE_DOZENT = 1;
$ROLLE_ADMIN = 2;

$max_account_lifetime = new DateInterval("P7D");
?>

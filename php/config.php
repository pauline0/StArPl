<?php
error_reporting(0);
ini_set("error_log", "/tmp/php-error.log");
error_log( "Hello, errors!" );
$server = "localhost";
$database = "starpl";
$username = "starpl";
$password = "starpl";
$conn = new mysqli($server, $username, $password, $database);

$maxAccountLifetime = new DateInterval("P7D");
?>

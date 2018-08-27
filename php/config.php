<?php
error_reporting(-1);
ini_set("error_log", "/tmp/php-error.log");
error_log( "Hello, errors!" );
$server = "localhost";
$database = "starpl";
$username = "starpl";
$password = "starpl";
$conn = new mysqli($server, $username, $password, $database);

$ROLLE_STUDENT = 0;
$ROLLE_DOZENT = 1;
$ROLLE_ADMIN = 2;

$maxAccountLifetime = new DateInterval("P7D");
?>

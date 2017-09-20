<?php
session_start();
if (isset($_REQUEST['edit']))
{
    if (isset($_SESSION['Id']) && !isset($_REQUEST['logout']))
    {
        include_once('html/viewArbeiten.html');
    }
    else
    {
		session_destroy();
        include_once('html/login.html');
    }
}
else if (isset($_REQUEST['upload']))
{
    if (isset($_SESSION['Id']) && !isset($_REQUEST['logout']))
    {
        include_once('html/upload.html');
    }
    else
    {
		session_destroy();
        include_once('html/login.html');
    }
}
else
{
    include_once('html/viewArbeiten.html');
}
?>
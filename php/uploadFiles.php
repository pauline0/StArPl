<?php
session_start(); // starten der PHP-Session
if (isset($_SESSION['Id']))
{
	$_post = filter_input_array(INPUT_POST); // es werden nur POST-Variablen akzeptiert, damit nicht mittels Link (get-vars) Anderungen an DB vorgenommen werden können
	$allowedFileTypes = array('pdf'); // diese Dateiendungen werden akzeptiert
	$dirUpload = '../upload';
	$Id = $_post['idOfArbeit'];
	$pathNewPics = "$dirUpload/$Id";
	mkdir("$pathNewPics", 0755, true);
	if(isset($_FILES["FileInputUploadArbeit"]) && !$_post['sperrvermerk'])
	{
		foreach ($_FILES["FileInputUploadArbeit"]["error"] as $key => $error)
		{
			if ($error == UPLOAD_ERR_OK)
			{
				$tmp_name = $_FILES["FileInputUploadArbeit"]["tmp_name"][$key];
				$name = $_FILES["FileInputUploadArbeit"]["name"][$key];
				$extension = pathinfo($name, PATHINFO_EXTENSION);
				if(in_array($extension,$allowedFileTypes))
				{
					move_uploaded_file($tmp_name, "$pathNewPics/$name");
				}
			}
		}
	}
	echo 'Die Arbeit wurde erfolgreich hochgeladen. In 3 Sekunden werden Sie zur <a href="..">Übersicht</a> weitergeleitet.';
}
header('Refresh:3; url=..');
?>
<?php
$allowedFileTypes = array('pdf'); // diese Dateiendungen werden akzeptiert
$dirUpload = '../upload';
$Id = 1; // noch anzupassen (aus DB abfragen, welche ID)
$pathNewPics = "$dirUpload/$Id";
mkdir("$pathNewPics", 0644);
if(isset($_FILES["FileInputUploadArbeit"]))
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
// header('Location: ' . '..');
?>
<?php
header("Content-Type: application/json; charset=utf-8"); // JSON-Antwort
include_once('config.php'); // Datenbankanbindung
session_start(); // starten der PHP-Session
$_post = filter_input_array(INPUT_POST); // es werden nur POST-Variablen akzeptiert, damit nicht mittels Link (get-vars) Anderungen an DB vorgenommen werden können
$action = $_post['action'];
// print_r($_post);
if (!$conn->connect_error)
{
	switch ($action)
	{
		case 'login':
		{
			$userName = $_post['UserName'];
			$password = md5($_post['Password']);
			$id = checkLogin($conn, $userName, $password);
			$userAnswer = array();
			$userAnswer[0] = $id;
			if ($id)
			{
				$userAnswer[1] = 'Login erfolgreich';
			}
			else
			{
				$userAnswer[1] = 'Login fehlgeschlagen';
			}
			echo json_encode($userAnswer);
			break;
		}
		case 'formUpload':
		{
			$titel = $_post['titel'];
			$studiengang = $_post['studiengang'];
			$language = $_post['language'];
			$artOfArbeit = $_post['artOfArbeit'];
			$jahrgang = $_post['jahrgang'];
			$kurzfassung = $_post['kurzfassung'];
			$conn->query("INSERT INTO `files`(`titel`, `studiengang`, `language`, `artOfArbeit`, `jahrgang`, `kurzfassung`) VALUES ('$titel', '$studiengang', '$language', '$artOfArbeit', '$jahrgang', '$kurzfassung');");
			$userAnswer = array();
			if ($conn->affected_rows > 0)
			{
				$userAnswer[0] = mysqli_insert_id($conn);
				$userAnswer[1] = 'Speichern erfolgreich';
			}
			else
			{
				$userAnswer[0] = 0;
				$userAnswer[1] = 'Speichern fehlgeschlagen';
			}
			echo json_encode($userAnswer);
			break;
		}
		default:
		{
			echo 'no Action';
			break;
		}
	}
}
else
{
	$userAnswer = array();
	$userAnswer[0] = -1;
	$userAnswer[1] = 'Datenbankverbindung fehlgeschlagen';
	echo json_encode($userAnswer);
}

// login checken (existiert UserName mit PW in DB?)
function checkLogin($conn, $userName, $password)
{
	$result = $conn->query("SELECT `Id` FROM `login` WHERE `UserName`='$userName' AND `Password`='$password';");
	$returnId = 0;
	while ($zeile = $result->fetch_assoc())
	{
		$returnId = $_SESSION['Id'] = $zeile['Id'];
	}
	return $returnId;
}
?>
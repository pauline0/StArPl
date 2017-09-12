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
?>
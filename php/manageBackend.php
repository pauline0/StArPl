<?php
header("Content-Type: application/json; charset=utf-8"); // JSON-Antwort
include_once('config.php'); // Datenbankanbindung
session_start(); // starten der PHP-Session
$_post = filter_input_array(INPUT_POST); // es werden nur POST-Variablen akzeptiert, damit nicht mittels Link (get-vars) Anderungen an DB vorgenommen werden können
$action = $_REQUEST['action'];
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
			if (isset($_SESSION['Id']))
			{
				$id = $_SESSION['Id'];
				$titel = $_post['titel'];
				$student = $_post['student'];
				$studiengang = $_post['studiengang'];
				$language = $_post['language'];
				$artOfArbeit = $_post['artOfArbeit'];
				$jahrgang = $_post['jahrgang'];
				$dozent = $_post['dozent'];
				$firma = $_post['firma'];
				$kurzfassung = $_post['kurzfassung'];
				$conn->query("INSERT INTO `files`(`userId`, `titel`, `student`, `studiengang`, `language`, `artOfArbeit`, `jahrgang`, `dozent`, `firma`, `kurzfassung`) VALUES ('$id', '$titel', '$student', '$studiengang', '$language', '$artOfArbeit', '$jahrgang', '$dozent', '$firma', '$kurzfassung');");
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
				$schlagwoerter = $_post['schlagwort'];
				$fileId = $userAnswer[0];
				foreach ($schlagwoerter as $key => $value)
				{
					if ($value)
					{
						$conn->query("INSERT INTO `SearchWords` (`FileId`, `Word`) VALUES ('$fileId', '$value');");
					}
				}
			}
			break;
		}
		case 'getAllSearchWords':
		{
			$result = $conn->query("SELECT DISTINCT `Word` FROM `SearchWords`;");
			$searchWordsArray = array();
			while ($zeile = $result->fetch_assoc())
			{
				array_push($searchWordsArray, $zeile['Word']);
			}
			echo json_encode($searchWordsArray);
			break;
		}
		case 'getAllArbeiten':
		{
			$result = $conn->query("SELECT * FROM `files`;");
			$allArbeiten = array();
			// $fileArray = array('test2.pdf');
			$i = 0;
			while ($zeile = $result->fetch_assoc())
			{
				array_push($allArbeiten, $zeile);
				$fileArray = getFileNamesArray($zeile['Id']);
				$allArbeiten[$i]['dateien'] = $fileArray;
				$i++;
			}
			echo json_encode($allArbeiten);
			// print_r($allArbeiten);
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

// liest die Dateinamen aus dem entsprechenden Verzeichnis aus
function getFileNamesArray($Id)
{
	$allFiles = array();
	$directory = '../upload/' . $Id . '/';
	if (is_dir ($directory))
	{
		// öffnen des Verzeichnisses
		if ($handle = opendir($directory))
		{
			// einlesen der Verzeichnisses
			while (($file = readdir($handle)) !== false)
			{
				if (filetype($file) != 'dir')
				{
					$allFiles[] = $file;
				}
			}
			closedir($handle);
		}
	}
	return $allFiles;
}
?>
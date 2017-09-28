<?php
header("Content-Type: application/json; charset=utf-8"); // JSON-Antwort
include_once('config.php'); // Datenbankanbindung
session_start(); // starten der PHP-Session
$_post = filter_input_array(INPUT_POST); // es werden nur POST-Variablen akzeptiert, damit nicht mittels Link (get-vars) Anderungen an DB vorgenommen werden können
$_post = replaceChars($_post);
$action = $_post['action'];
if (!$conn->connect_error)
{
	switch ($action)
	{
		case 'formLogin':
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
		case 'loginHwr':
		{
			// toDo: es ist zu überprüfen, ob UserName mit s_* beginnt. Falls ja, Hinweis / Fehler zurückgeben
			$userName = $_post['UserName'];
			$password = $_post['Password'];
			if (substr($userName, 0, 2) != 's_' || $userName == 's_brandenburg' || $userName == 's_kleinvik')
			// if (true)
			{
				$url = 'https://webmail.stud.hwr-berlin.de/ajax/login?action=login';
				$post = "name=$userName&password=$password";
				//$returnValueLogin = json_decode(fireCURL($url, $post));
				$userAnswer = array();
				// if ($returnValueLogin->session != '')
				if (true)
				{
					// $session = $_SESSION['session'] = $returnValueLogin->session;
					$session =  $_SESSION['session'] = '';
					// $uid = $returnValueLogin->user_id;
					$uid = '';
					$url = 'https://webmail.stud.hwr-berlin.de/ajax/contacts?action=getuser';
					$post = "name=$session&password=$uid";
					//$returnUserName = json_decode(fireCURL($url, $post));
					// if ($returnValueLogin->display_name)
					if (true)
					{
						// $_SESSION['UserNAme'] = $returnValueLogin->display_name;
						$_SESSION['UserName'] = 'test';
						$userRole = 0; // muss in DB manuell angepasst werden (einmal Höhne einloggen lassen)
						$userId = checkIfUserExist($conn, $userName);
						if (!$userId)
						{
							$userAnswer[0] = createUserInDb($conn, $userName, $userRole);
						}
						else
						{
							$userAnswer[0] = $userId;
						}
						$userAnswer[1] = 'Login erfolgreich';
					}
				}
				else
				{
					$userAnswer[0] = 0;
					$userAnswer[1] = 'Login fehlgeschlagen';
				}
			}
			else
			{
				$userAnswer[0] = 0;
				$userAnswer[1] = 'Login fehlgeschlagen';
			}
			// echo $returnValueLogin->session;
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
				$betreuer = $_post['betreuer'];
				$firma = $_post['firma'];
				if (isset($_post['sperrvermerk']))
				{
					$sperrvermerk = $_post['sperrvermerk'];
				}
				else
				{
					$sperrvermerk = 0;
				}
				$kurzfassung = $_post['kurzfassung'];
				$conn->query("INSERT INTO `files`(`userId`, `titel`, `student`, `studiengang`, `language`, `artOfArbeit`, `jahrgang`, `betreuer`, `firma`, `sperrvermerk`, `kurzfassung`, `downloads`) VALUES ('$id', '$titel', '$student', '$studiengang', '$language', '$artOfArbeit', '$jahrgang', '$betreuer', '$firma', '$sperrvermerk', '$kurzfassung', '0');");
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
		case 'fileAjaxUpload':
		{
			if (isset($_SESSION['Id']))
			{
				$Id = $_post['id'];
				$allowedFileTypes = array('pdf'); // diese Dateiendungen werden akzeptiert
				$dirUpload = '../upload';
				$pathNewPics = "$dirUpload/$Id/";
				mkdir("$pathNewPics", 0755, true);
				foreach($_FILES as $key => $value)
				{
					$tmpName = $value['tmp_name'];
					$name = $value['name'];
					move_uploaded_file($tmpName, $pathNewPics . $name);
				}
			}
			break;
		}
		case 'formSaveArbeit':
		{
			if (isset($_SESSION['Id']))
			{
				$id = $_post['id'];
				$titel = $_post['titel'];
				$student = $_post['student'];
				$studiengang = $_post['studiengang'];
				$language = $_post['language'];
				$artOfArbeit = $_post['artOfArbeit'];
				$jahrgang = $_post['jahrgang'];
				$betreuer = $_post['betreuer'];
				$firma = $_post['firma'];
				$kurzfassung = $_post['kurzfassung'];
				$conn->query("UPDATE `files` SET `titel`='$titel', `student`='$student', `studiengang`='$studiengang', `language`='$language', `artOfArbeit`='$artOfArbeit', `jahrgang`='$jahrgang', `betreuer`='$betreuer', `firma`='$firma', `kurzfassung`='$kurzfassung' WHERE `Id`='$id';");
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
		case 'getAllSearchWordsWithId':
		{
			$result = $conn->query("SELECT * FROM `SearchWords`;");
			$searchWordsArray = array();
			while ($zeile = $result->fetch_assoc())
			{
				array_push($searchWordsArray, $zeile);
			}
			echo json_encode($searchWordsArray);
			break;
		}
		case 'getAllArbeiten':
		{
			$result = $conn->query("SELECT * FROM `files` ORDER BY `titel` ASC;");
			$allArbeiten = array();
			$i = 0;
			while ($zeile = $result->fetch_assoc())
			{
				array_push($allArbeiten, $zeile);
				$allArbeiten[$i]['dateien'] = getFileNamesArray($zeile['Id']);
				$i++;
			}
			echo json_encode($allArbeiten);
			break;
		}
		case 'getOwnUser':
		{
			if (isset($_SESSION['Id']))
			{
				$id = $_SESSION['Id'];
				$result = $conn->query("SELECT * FROM `userLogin` WHERE `Id`='$id';");
				$answer = array();
				while ($zeile = $result->fetch_assoc())
				{
					array_push($answer, $zeile);
					$_SESSION['UserRole'] = $zeile['UserRole'];
				}
				echo json_encode($answer);
			}
			break;
		}
		case 'deleteArbeit': // gibt keine Rückmeldung aus
		{
			if (isset($_SESSION['Id']))
			{
				$userIdOfArbeit = 0;
				$id = $_post['id'];
				$result = $conn->query("SELECT `userId` FROM `files` WHERE `Id`='$id';");
				while ($zeile = $result->fetch_assoc())
				{
					$userIdOfArbeit = $zeile['userId'];
				}
				if ($_SESSION['UserRole'] >= 1 || $userIdOfArbeit)
				{
					$conn->query("DELETE FROM `files` WHERE `Id`='$id';");
					$conn->query("DELETE FROM `SearchWords` WHERE `FileId`='$id';");
					$directory = "../upload/$id/";
					if (is_dir($directory))
					{
						// öffnen des Verzeichnisses
						if ($handle = opendir($directory))
						{
							// einlesen der Verzeichnisses
							while (($file = readdir($handle)) !== false)
							{
								if (filetype($file) != 'dir')
								{
									unlink($directory.$file);
								}
							}
							closedir($handle);
						}
					}
				}
			}
			break;
		}
		case 'incrementDownloads':
		{
			$id = $_post['id'];
			$conn->query("UPDATE `files` SET `downloads`=`downloads`+1 WHERE `id`='$id';");
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

// überprüft, ob ein User bereits in der Datenbank existiert
function checkIfUserExist($conn, $userName)
{
	$userId = 0;
	$result = $conn->query("SELECT `Id` FROM `userLogin` WHERE `UserName`='$userName';");
	while ($zeile = $result->fetch_assoc())
	{
		$userId = $_SESSION['Id'] = $zeile['Id'];
	}
	return $userId;
}

// legt einen User in der Datenbank an
function createUserInDb($conn, $userName, $userRole)
{
	$conn->query("INSERT INTO `userLogin` (`UserName`, `UserRole`) VALUES ('$userName', '$userRole');");
	return $_SESSION['Id'] = mysqli_insert_id($conn);
}

// liest die Dateinamen aus dem entsprechenden Verzeichnis aus
function getFileNamesArray($Id)
{
	$allFiles = array();
	$directory = "../upload/$Id/";
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

// ersetzt Spezialzeichen
function replaceChars($str)
{
	$str = str_replace("\\", "&#92;", $str); // Backslash
	$str = str_replace("'", "&#39;", $str); // einfaches Anführungszeichen
	$str = str_replace("`", "&#96;", $str); // schräges einfaches Anführungszeichen links (gravis)
	return $str;
}

// benötigt, um header-Problem mit jQuery.post() zu umgehen
// ebenfalls in index.php vorhanden
function fireCURL($url, $post)
{
	$curl = curl_init();
	curl_setopt($curl, CURLOPT_URL, $url);
	curl_setopt($curl, CURLOPT_POST, true);
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($curl, CURLOPT_POSTFIELDS, $post);
	$response = curl_exec($curl);
	curl_close($curl);
	return $response;
}
?>
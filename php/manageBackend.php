<?php
header("Content-Type: application/json; charset=utf-8"); // JSON-Antwort
include_once('config.php'); // Datenbankanbindung
session_start(); // starten der PHP-Session
$_post = filter_input_array(INPUT_POST); // es werden nur POST-Variablen akzeptiert, damit nicht mittels Link (get-vars) Anderungen an DB vorgenommen werden können
$_post = replaceChars($_post);
error_log("Post params");
$action = $_post['action'];
error_log("your message");
error_log("Action: ".$action);
if (!$conn->connect_error)
{
	switch ($action)
	{
		case 'loginHwr':
		{
			$userName = $_post['UserName'];
			$password = $_post['Password'];
			$userAnswer = array();
			if (md5($userName) == '21232f297a57a5a743894a0e4a801fc3' && md5($password) == 'e36c1c30ed01795422f07944ebb65607')
			{
				$_SESSION['StArPl_session'] = md5('angucken4all');
				$userRole = 0; // muss in DB manuell angepasst werden
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
			else if (substr($userName, 0, 2) != 's_')
			{
				//Muss auf iPool ausgelegt werden
				// Outlook Web Access (HWR-Seite im Schnellzugriff)
				$goalUrl = 'https://exchange.hwr-berlin.de/CookieAuth.dll?Logon';
				$post = 'curl=Z2F&flags=0&forcedownlevel=0&formdir=1&trusted=0';
				$post .= "&username=$userName&password=$password&SubmitCreds=Log+On";
				$loginSuccessful = loginOpenExchange($goalUrl, $post);
				if($loginSuccessful){
					$userRole = 2;
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
				else{
					$userAnswer[0] = 0;
					$userAnswer[1] = 'Login fehlgeschlagen';
				}
			}
			else if ($userName == 's_brandenburg' || $userName == 's_kleinvik' || $userName == 's_kochp')
			{
				$url = 'https://webmail.stud.hwr-berlin.de/ajax/login?action=login';
				$post = "name=$userName&password=$password";
				$returnValueLogin = json_decode(fireCURL($url, $post));
				if (true)#$returnValueLogin->session != '')
				{
					$_SESSION['StArPl_session'] = "whatever";#$returnValueLogin->session;
					$userRole = 0; // muss in DB manuell angepasst werden
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
			echo json_encode($userAnswer);
			break;
		}
		case 'formUpload':
		{
			if (isset($_SESSION['StArPl_Id']))
			{
				$id = $_SESSION['StArPl_Id'];
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
			if (isset($_SESSION['StArPl_Id']))
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
			if (isset($_SESSION['StArPl_Id']))
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
			if (isset($_SESSION['StArPl_Id']))
			{
				$id = $_SESSION['StArPl_Id'];
				$result = $conn->query("SELECT * FROM `userLogin` WHERE `Id`='$id';");
				$answer = array();
				while ($zeile = $result->fetch_assoc())
				{
					array_push($answer, $zeile);
					$_SESSION['StArPl_UserRole'] = $zeile['UserRole'];
				}
				echo json_encode($answer);
			}
			else
			{
				$answer = array();
				$noUser = array();
				array_push($noUser, 0);
				array_push($noUser, '');
				array_push($noUser, 0);
				array_push($answer, $noUser);
				echo json_encode($answer);
			}
			break;
		}
		case 'deleteArbeit': // gibt keine Rückmeldung aus
		{
			if (isset($_SESSION['StArPl_Id']))
			{
				$userIdOfArbeit = 0;
				$id = $_post['id'];
				$result = $conn->query("SELECT `userId` FROM `files` WHERE `Id`='$id';");
				while ($zeile = $result->fetch_assoc())
				{
					$userIdOfArbeit = $zeile['userId'];
				}
				if ($_SESSION['StArPl_UserRole'] >= 1 || $userIdOfArbeit)
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
		case 'formCreateUsers':
		{
			if(isset($_SESSION['StArPl_Id'])){
				$activatorId = $_SESSION['StArPl_Id'];
				$userRole = $conn->query("SELECT `UserRole` FROM `userLogin` where `id`='$activatorId'");
				$userAnswer = array();
				error_log("Create user");
				error_log($userRole);
				if($userRole > 0){
					error_log("berechtigt");
					error_log("Post params".implode(",",$_post));
					$name = $_post['username'];
					$expiry = new DateTime($_post["datum_gueltig"]);
					$time = explode(":",$_post["time_gueltig"]);
					$expiry-> add(new DateInterval("PT{$time[0]}H{$time[1]}M"));
					$lifetimeLimit = new DateTime();
					$lifetimeLimit = $lifetimeLimit->add($maxAccountLifetime);
					if($expiry < $lifetimeLimit)
					{
						error_log("time3");
						$userId = checkIfUserExist($conn, $name);
						if (!$userId){
							error_log("user existiert nicht");
							error_log($expiry->format('Y-m-d H:i:s'));
							createTemporaryUserInDb($conn, $activatorId,  $name, $expiry);
						}
						else{
							error_log("user existiert");
							$userAnswer[0]= 0;
							$userAnswer[1]="User existiert bereits.";
						}
					}
					else{
						$userAnswer[0]=0;
						$userAnswer[1]="Account Zeitlimit überschritten!";
					}
				}
				else{
					$userAnswer[0]=0;
					$userAnswer[1]="Du hast nicht die nötigen Berechtigungen für diese Aktion";
				}
			}
			error_log($userAnswer);
			echo json_encode($userAnswer);
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

function validateCredentials($userName, $password)
{

	$curl = curl_init();
	curl_setopt($curl, CURLOPT_URL, $url);
	curl_setopt($curl, CURLOPT_POST, true);
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($curl, CURLOPT_POSTFIELDS, $post);
	$response = curl_exec($curl);
	curl_close($curl);
}

// überprüft, ob ein User bereits in der Datenbank existiert
function checkIfUserExist($conn, $userName)
{
	$userId = 0;
	$result = $conn->query("SELECT `Id` FROM `userLogin` WHERE `UserName`='$userName';");
	while ($zeile = $result->fetch_assoc())
	{
		$userId = $_SESSION['StArPl_Id'] = $zeile['Id'];
	}
	return $userId;
}

// legt einen neuen User in der Datenbank an
function createUserInDb($conn, $userName, $userRole)
{
	$conn->query("INSERT INTO `userLogin` (`UserName`, `UserRole`) VALUES ('$userName', '$userRole');");
	return $_SESSION['StArPl_Id'] = mysqli_insert_id($conn);
}

function createTemporaryUserInDb($conn, $activatorId,  $userName, $expiry ){
	error_log("createTemporaryUserInDb");
	$userRole = 0;
	$userId = createUserInDb($conn, $userName, $userRole);
	error_log($userId);
	error_log($activatorId);
	error_log($expiry);
	$expiry_str = $expiry->format('Y-m-d H:i:s');
	error_log($expiry_str);
	error_log("INSERT INTO `studentAccounts` (`UserId`,`DozentId`,`ExpiryDate`) VALUES ('$userId', '$activatorId',  '$expiry_str');");
	$conn->query("INSERT INTO `studentAccounts` (`UserId`,`DozentId`,`ExpiryDate`) VALUES ('$userId', '$activatorId',  '$expiry_str');");
	return $userId;
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


function loginOpenExchange($url, $post)
{
	$curl = curl_init();
	$headers = [];
	$handleHeaders = function($curl, $header) use (&$headers)
	  {
	    $len = strlen($header);
	    $header = explode(':', $header, 2);
	    if (count($header) < 2) // ignore invalid headers
	      return $len;

	    $name = strtolower(trim($header[0]));
	    if (!array_key_exists($name, $headers))
	      $headers[$name] = [trim($header[1])];
	    else
	      $headers[$name][] = trim($header[1]);

	    return $len;
	  };
	curl_setopt($curl, CURLOPT_URL, $url);
	curl_setopt($curl, CURLOPT_POST, true);
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($curl, CURLOPT_POSTFIELDS, $post);
	curl_setopt($curl, CURLOPT_HEADER, true);
	curl_setopt($curl, CURLOPT_HEADERFUNCTION,$handleHeaders);
	$curl_info= curl_getinfo($curl);
	$response = curl_exec($curl);
	$info = curl_getinfo($curl);
	$header_size = curl_getinfo($curl, CURLINFO_HEADER_SIZE);
	$header = substr($response, 0, $header_size);
	curl_close($curl);
	$curl2 = curl_init();
	$request_headers = array();
	$cookie =  $headers["set-cookie"][0];
	$request_headers[] = 'Cookie: '.$cookie;
	$request_headers[] = 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:57.0) Gecko/20100101 Firefox/57.0';
	$headers = [];
	curl_setopt($curl2, CURLOPT_URL, "https://exchange.hwr-berlin.de/");
	curl_setopt($curl2,  CURLOPT_HTTPHEADER, $request_headers);
	curl_setopt($curl2, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($curl2, CURLOPT_HEADER, true);
	curl_setopt($curl2, CURLOPT_HEADERFUNCTION,$handleHeaders);
	$response = curl_exec($curl2);
	$redirect_url = curl_getinfo($curl2, CURLINFO_REDIRECT_URL);
	$redirectSuccess = $redirect_url == "https://exchange.hwr-berlin.de/OWA";
	return $redirectSuccess;
}

?>

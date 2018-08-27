<?php
header("Content-Type: application/json; charset=utf-8"); // JSON-Antwort
//include_once('config.php'); // Datenbankanbindung
include_once('lib_auth.inc.php');
include_once('lib_common.inc.php');
session_start(); // starten der PHP-Session
$_post = filter_input_array(INPUT_POST); // es werden nur POST-Variablen akzeptiert, damit nicht mittels Link (get-vars) Anderungen an DB vorgenommen werden können
$_post = replaceChars($_post);
error_log(implode(",",array_keys($_post)));
error_log(implode($_post));
$action = $_post['action'];
error_log("Action: ".$action);
check_if_csrf();
if (!$conn->connect_error)
{
	switch ($action)
	{
		case 'formUpload':
		{
			if (isset($_SESSION["starpl"]["user_id"]) && $_SESSION["csrf_detected"] === false)
			{
				$fileId = saveDocument($conn,$_SESSION["starpl"]["user_id"], check_if_min_dozent($_SESSION["starpl"]["user_id"]), $_post);
				$userAnswer = array();
				if ($fileId)
				{
					$userAnswer[0] = $fileId;
					$userAnswer[1] = 'Speichern erfolgreich';
				}
				else
				{
					$userAnswer[0] = 0;
					$userAnswer[1] = 'Speichern fehlgeschlagen';
				}
				echo json_encode($userAnswer);
				$schlagwoerter = $_post['schlagwort'];
				foreach ($schlagwoerter as $key => $value)
				{
					if ($value)
					{
						$value = $conn->real_escape_string($value);
						$conn->query("INSERT INTO `SearchWords` (`FileId`, `Word`) VALUES ('$fileId', '$value');");
					}
				}
			}
			break;
		}
		case 'fileAjaxUpload':
		{
			if (isset($_SESSION["starpl"]["user_id"]) && $_SESSION["csrf_detected"] === false )
			{
				$Id = $_post['id'];
				if(check_if_min_admin($_SESSION["starpl"]["user_id"]) || isOwnerOfFile($conn, $Id, $_SESSION["starpl"]["user_id"]) ){
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
			}
			break;
		}
		case 'formSaveArbeit':
		{
			if (isset($_SESSION["starpl"]["user_id"]) && $_SESSION["csrf_detected"] === false)
			{
				$id = $conn->real_escape_string($_post['id']);
				$answer = array();
				if(check_if_min_admin($_SESSION["starpl"]["user_id"]) || isOwnerOfFile($conn, $id, $_SESSION["starpl"]["user_id"]) ){
					update_document_in_database($conn, $_post, $id);
					$deleteSearchwords = json_decode($_post['deleteSW']);
					$deleteSearchwords = array_to_mysql($conn, $deleteSearchwords);
					$addSearchwords = json_decode($_post['addSW']);
					$conn->query("DELETE FROM `SearchWords` where `FileId` = '$id' AND `Word` IN ('$deleteSearchwords');");
					if ($addSearchwords){
						$addSearchwords = array_unique($addSearchwords);
						$existingSearchwords = getAllSearchWordsForDocument($conn, $id);
						foreach ($addSearchwords as $value)
						{
							//TODO: Optimize
							if (!in_array($value, $existingSearchwords)){
								$value = $conn->real_escape_string($value);
								$conn->query("INSERT INTO `SearchWords` (`FileId`, `Word`) VALUES ('$id', '$value');");
							}
						}
					}
					$deleteFiles = json_decode($_post["delFiles"]);
					deleteFilesForArbeit($id, $deleteFiles);
					$answer[0] = 1;
					$answer[1] = "Löschen erfolgreich";
				}
				else{
					$answer[0] = 0;
					$answer[1] = "Nötige Berechtigungen fehlen";
				}
			}
			break;
		}
		case 'getAllSearchWordsForDocument':
		{
			$docId = $_post["id"];
			$allSearchwords = getAllSearchWordsForDocument($conn,$docId);
			echo json_encode($allSearchwords);
			break;
		}

		case 'getPossibleDocents':
		{
			$userId = $_SESSION["starpl"]["user_id"];
			$result = $conn->query("SELECT `UserName`,  `userLogin`.`Id` from `studentAccounts` JOIN `userLogin` ON `userLogin`.`Id` = `DozentId` where `ExpiryDate` > NOW() AND `UserId` = '$userId';");
			$possibleDocents = array();
			$isStudentAccount = check_user_level($userId, 0, "=");
			while($row = $result->fetch_assoc()){
				$possibleDocents[$row["UserName"]] = $row["Id"];
			}
			$answer = array();
			$answer[0] = $isStudentAccount;
			$answer[1] = $possibleDocents;
			echo json_encode($answer);
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
			if (isset($_SESSION["starpl"]["user_id"])){
				$userId = $_SESSION["starpl"]["user_id"];
				$queryStr = "SELECT `files`.* FROM `files` WHERE NOT `privat` OR `DozentId`='$userId' OR `releaseRequests`.ORDER BY `titel` ASC;";
			}
			else{
				$queryStr = "SELECT * FROM `files` WHERE NOT `privat`  ORDER BY `titel` ASC;";
			}
			$result = $conn->query("SELECT `files`.* FROM `files` WHERE NOT `privat`   ORDER BY `titel` ASC;");
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
		case 'getCreatedUsers':{
			$answer= array();
			if (isset($_SESSION["starpl"]["user_id"])){
				$userId = $conn->real_escape_string($_SESSION["starpl"]["user_id"]);
				$result = $conn->query("SELECT `UserName`,`studentAccounts`.`Id`, `ExpiryDate`, `fileId`, `titel` FROM `studentAccounts`  JOIN `userLogin` ON `userLogin`.`Id` = `studentAccounts`.`UserId` LEFT JOIN `releaseRequests` ON `studentAccounts`.`Id` = studentAccountId LEFT JOIN `files` ON `files`.`id` = `fileId` where `DozentId` = '$userId';");
				$allUsers = array();
				while ($zeile = $result->fetch_assoc())
				{
					$UserName = $zeile["UserName"];
					if (!array_key_exists($UserName, $allUsers)){
						$allUsers[$UserName] = $zeile;
						unset($allUsers[$UserName]["titel"], $allUsers[$UserName]["fileId"]);
						$allUsers[$UserName]["releaseRequests"] = [];
					}
					if($zeile["fileId"]){
						array_push($allUsers[$UserName]["releaseRequests"],[$zeile["fileId"], $zeile["titel"]]);
					}
				}
				$answer = array_values($allUsers);
			}
			echo json_encode($answer);
			break;
		}

		case 'getOwnUser':
		{
			if (isset($_SESSION["starpl"]["user_id"]))
			{
				$id = $conn->real_escape_string($_SESSION["starpl"]["user_id"]);
				$result = $conn->query("SELECT * FROM `userLogin` WHERE `Id`='$id';");
				$answer = array();
				while ($zeile = $result->fetch_assoc())
				{
					array_push($answer, $zeile);
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
			if (isset($_SESSION["starpl"]["user_id"]) && $_SESSION["csrf_detected"] === false)
			{
				$id = $conn->real_escape_string($_post['id']);
				$user_id = $conn->real_escape_string($_SESSION["starpl"]["user_id"]);
				if (check_if_min_admin($user_id)|| isOwnerOfFile($conn,$id,$_SESSION["starpl"]["user_id"]))
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

		case 'getPrivateArbeit':
		{
			$fileId = $conn->real_escape_string($_post["id"]);
			$answer = array();
			if ($fileId !== 0 && $_SESSION["starpl"]["user_id"] && $_SESSION["csrf_detected"] === false) {
				$authorizationLevel = checkIfAllowedToSeeFile($conn, $fileId, $_SESSION["starpl"]["user_id"]);
				$answer[0] = $authorizationLevel;
				if ($authorizationLevel > 0){
					$answer[1] = getFileById($conn, $fileId);
					$answer[1]["searchWords"] = getAllSearchWordsForDocument($conn, $fileId);
				}
			}
			else{
				$answer[0] = -1;
			}
			echo json_encode($answer);
			break;
		}

		case "releasePrivateDocument":
		{
			$fileId = $conn->real_escape_string($_post["id"]);
			$answer = array();
			$userId = $conn->real_escape_string($_SESSION["starpl"]["user_id"]);
			if ($fileId && $userId && $_SESSION["csrf_detected"] === false){
				$updateFileStr = <<<EOT
UPDATE `files`
JOIN `releaseRequests` ON `fileId` = `files`.id
JOIN studentAccounts ON studentAccountId = studentAccounts.Id
SET `privat`= 0, `files`.UserId=$userId
WHERE `DozentId`='$userId' AND `fileId` = '$fileId';
EOT;
				$conn->query($updateFileStr);
				if ($conn->affected_rows > 0){
					$conn->query("DELETE FROM `releaseRequests` where `FileId` = '$fileId';");
					$answer[0] = $fileId;
				}
				else{
						$answer[0]= 0;
				}
			}
			echo(json_encode($answer));
			break;
		}

		case 'formCreateUsers':
		{
			if(isset($_SESSION["starpl"]["user_id"])){
				$activatorId = $conn->real_escape_string($_SESSION["starpl"]["user_id"]);
				$userAnswer = array();
				if(($_SESSION["starpl"]["user_id"] > 0) && ($_SESSION["csrf_detected"] === false)){
					$name = $conn->real_escape_string($_post["username"]);
					$expiry = getExpiryDate($_post["datum_gueltig"],$_post["time_gueltig"], $maxAccountLifetime);
					if(!$expiry){
						$userAnswer[0]=0;
						$userAnswer[1]="Account Zeitlimit überschritten!";
					}
					else if (substr($name, 0, 2) != 's_'){
						$userAnswer[0] = 0;
						$userAnswer[1]="Benutzername ist keine Studentenkennung";
					}
					else
					{
						$userId = checkIfUserExist($conn, $name);
						if (!$userId){
							$userAnswer[0] = createTemporaryUserInDb($conn, $activatorId,  $name, $expiry);
							$userAnswer[1] = "Neuer Account wurde erstellt";
						}
						else{
							$accountId = getStudentAccountForUser($conn, $userId, $activatorId);
							$userAnswer[0] = $accountId;
							if ($accountId == 0){
								$userAnswer[0] = createTemporaryAccountInDB($conn, $activatorId,  $userId, $expiry);
								$userAnswer[1] = "Neuer Studentenaccount wurde erstellt";
							}
							else {
								$userAnswer[0] = 0;
								$userAnswer[1]="Studierendenaccount existiert bereits";
							}
						}
					}
				}
				else{
					$userAnswer[0]=0;
					$userAnswer[1]="Nötige Berechtigungen fehlen.";
				}
			}
			else {
				$userAnswer[0]=0;
				$userAnswer[1]="Nicht angemeldet";
			}
			echo json_encode($userAnswer);
			break;
		}

		case 'formUpdateUsers':
			{
				if(isset($_SESSION["starpl"]["user_id"]) && $_SESSION["csrf_detected"] === false){
					$activatorId = $_SESSION["starpl"]["user_id"];
					$userAnswer = array();
					if(check_if_min_dozent($_SESSION["starpl"]["user_id"])){
						$expiry = getExpiryDate($_post["datum_gueltig"],$_post["time_gueltig"], $maxAccountLifetime);
						$accountId = $conn->real_escape_string($_post["id"]);
						if(!$expiry){
							$userAnswer[0]=0;
							$userAnswer[1]="Account Zeitlimit überschritten!";
						}
						elseif (!checkIfDozentOfStudentAccount($conn, $accountId, $activatorId)) {
							$userAnswer[0]= 0;
							$userAnswer[1]="Rechte für diese Aktion fehlen.";
						}
						else
						{
							$updateSuccesful = updateTemporaryAccount($conn, $accountId, $expiry);
							if($updateSuccesful){
								$userAnswer[0] = 1;
								$userAnswer[1] = "Änderungen gespeichert";
							}
							else {
								$userAnswer[0] = 0;
								$userAnswer[1] = "Account konnte nicht aktualisiert werden.";
							}
						}
					}
					else{
						$userAnswer[0] = 0;
						$userAnswer[1] = "Nötige Berechtigungen fehlen.";
					}
				}
				else{
					$userAnswer[0] = -1;
					$userAnswer[1] = "Erneuter Login erforderlich.";
				}
				echo json_encode($userAnswer);
				break;
		}

		case 'deleteStudentAccount':
		{
			if ($_SESSION["csrf_detected"] === false){
				$accountId = $conn->real_escape_string($_post['id']);
				$dozentId = $_SESSION["starpl"]["user_id"];
				$answer = array();
				$filesOfStudent = $conn->query("SELECT FileId FROM studentAccounts JOIN releaseRequests ON `studentAccounts`.`Id` = studentAccountId where `DozentId` = '$dozentId' AND `studentAccounts`.`Id`= '$accountId';");
				while ($row = $filesOfStudent->fetch_assoc()){
					$fileId = $row["FileId"];
					$conn->query("DELETE from `files` WHERE `Id` = '$fileId'");
					deleteFilesForArbeit($fileId);
				}
				$conn->query("DELETE FROM studentAccounts where `DozentId` = '$dozentId' AND `Id`= '$accountId'");
				if ($conn->affected_rows > 0 ){
					$answer["status"] = 1;
				}
				else{
					$answer["status"] = 0;
				}
				echo json_encode($answer);
				break;
			}
		}
		case 'incrementDownloads':
		{
			$id = $_post['id'];
			$query = "UPDATE `files` SET `downloads`=`downloads`+1 WHERE `id`= ?;";
			$stmt = $conn->prepare($query);
			$stmt->bind_param("i", $id);
			$stmt->execute();
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

// überprüft, ob ein User bereits in der Datenbank existiert
function checkIfUserExist($conn, $userName)
{
	$userId = 0;
	$result = $conn->query("SELECT `Id` FROM `userLogin` WHERE `UserName`='$userName';");
	while ($zeile = $result->fetch_assoc())
	{
		$userId = $zeile['Id'];
	}
	return $userId;
}

function getStudentAccountForUser($conn, $userId, $dozentId = null){
	$queryStr = "SELECT `studentAccounts`.`Id`  FROM `studentAccounts` WHERE `userId`='$userId'";
	if ($dozentId){
		$queryStr = $queryStr . " AND `DozentId` = '$dozentId'";
		}
	$queryStr = $queryStr . ";";
	$result = $conn->query($queryStr);
	while ($row = $result->fetch_assoc()){
		return $row["Id"];
	}
}

function checkIfDozentOfStudentAccount($conn, $accountId, $dozentId){
	$result = $conn->query("SELECT * FROM `studentAccounts` WHERE `Id` = ".$accountId." and `DozentId` = ".$dozentId.";");
	return ($result->num_rows > 0);
}

function getValidStudentAccountForUser($conn, $userId, $dozentId = null){
	$queryStr = "SELECT `studentAccounts`.`Id`  FROM `studentAccounts` WHERE (`ExpiryDate` > NOW()) AND `userId`='$userId'";
	if ($dozentId){
		$queryStr = $queryStr . " AND `DozentId` = '$dozentId'";
	}
	$queryStr = $queryStr . ";";
	$result = $conn->query($queryStr);
	while ($row = $result->fetch_assoc()){
		return $row["Id"];
	}
}

// legt einen neuen User in der Datenbank an
function createTemporaryAccountInDB($conn, $activatorId, $userId, $expiry){
	$expiry_str = $expiry->format('Y-m-d H:i:s');
	$conn->query("INSERT INTO `studentAccounts` (`UserId`,`DozentId`,`ExpiryDate`) VALUES ('$userId', '$activatorId',  '$expiry_str');");
	return mysqli_insert_id($conn);
}

function updateTemporaryAccount($conn, $accountId, $expiry){
	$expiry_str = $expiry->format('Y-m-d H:i:s');
	$conn->query("UPDATE `studentAccounts` SET `ExpiryDate`='$expiry_str' WHERE Id='$accountId'");
	return ($conn->affected_rows > 0);
}

function getExpiryDate($expiry_date, $expiry_time, $maxAccountLifetime){
	$expiry = new DateTime($expiry_date);
	$time = explode(":",$expiry_time);
	$expiry-> add(new DateInterval("PT{$time[0]}H{$time[1]}M"));
	$lifetimeLimit = new DateTime();
	$lifetimeLimit = $lifetimeLimit->add($maxAccountLifetime);
	return ($expiry <= $lifetimeLimit) ? $expiry : false;
}

function createTemporaryUserInDb($conn, $activatorId,  $userName, $expiry ){
	$userRole = 0;
	$conn->query("INSERT INTO `userLogin` (`UserName`, `UserRole`) VALUES ('$userName', '$userRole');");
	$userId = mysqli_insert_id($conn);
	$accountId = createTemporaryAccountInDB($conn, $activatorId, $userId, $expiry);
	return $accountId;
}

function checkIfAllowedToSeeFile($conn, $fileId, $userId){
	$accessLevel = 0;
	$result = $conn->query("SELECT (`DozentId`='$userId') AS isDozent FROM `releaseRequests`  JOIN `studentAccounts` ON `studentAccounts`.Id = `studentAccountId` where `FileId` = '$fileId' AND (`UserId`='$userId' OR `DozentId`='$userId');");
	while($row = $result-> fetch_assoc()){
		$accessLevel = ($row["isDozent"]) ? 2 : 1;
	}
	return $accessLevel;
}


function getFileById($conn, $fileId){
	$result = $conn->query("SELECT * FROM `files` WHERE `Id` = '$fileId'; ");
	while ($file = $result->fetch_assoc())
	{
		$file['dateien'] = getFileNamesArray($file['Id']);
		return $file;
	}
}

function findTemporaryUserInDB($conn, $userName){
	$result = $conn->query("SELECT `userLogin`.`Id`,`ExpiryDate`, (`ExpiryDate` > NOW()) AS `Valid` FROM `userLogin` LEFT JOIN `studentAccounts` ON `userLogin`.Id = `studentAccounts`.`UserId` WHERE `UserName`='$userName';");
	if(!$result){
		throw UserException("UserName oder Passwort falsch.");
	}
	while ($zeile = $result->fetch_assoc()){
		if (!$zeile["ExpiryDate"]){
			throw new UserException("Für diesen Benutzer existieren keine gültigen Accounts");
		}
		if ($zeile["Valid"]){
			$userId = $zeile["Id"];
			return $userId;
		}
	}
	throw new UserException("Alle temporären Accounts dieses Nutzers sind nicht mehr gültig.");
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
				if (filetype($directory.$file) != 'dir')
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
	//todo
	// $str = str_replace("\\", "&#92;", $str); // Backslash
	// $str = str_replace("'", "&#39;", $str); // einfaches Anführungszeichen
	// $str = str_replace("`", "&#96;", $str); // schräges einfaches Anführungszeichen links (gravis)
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


function getAllSearchWordsForDocument($conn,$documentId){
	$result = $conn->query("SELECT `Word` FROM `SearchWords` where `fileId` = '$documentId';");
	$searchWordsArray = array();
	while ($zeile = $result->fetch_assoc()){
		array_push($searchWordsArray, $zeile["Word"]);
	}
	return $searchWordsArray;
}

function deleteFilesForArbeit($id, $arrOfFiles=null){
	$directory = "../upload/$id/";
	if (is_dir($directory))
	{
		// öffnen des Verzeichnisses
		if ($handle = opendir($directory))
		{
			// einlesen der Verzeichnisses
			while (($file = readdir($handle)) !== false)
			{
				error_log($file);
				error_log($arrOfFiles);
				if($arrOfFiles === null || in_array($file, $arrOfFiles )){
					if (filetype($file) != 'dir')
					{
						unlink($directory.$file);
					}
				}
			}
			closedir($handle);
		}
	}
}

function saveDocument($conn, $userId, $uploaded_by_dozent ,$fileParams){
	if (validateFileParams($fileParams)){
		if ($uploaded_by_dozent){
			$fileId = save_document_in_database($conn, $fileParams, $userId, '0' );#mysqli_insert_id($conn);
		}
		else {
			$docentId = $fileParams["docentId"];
			$studentAccountId = getValidStudentAccountForUser($conn, $userId, $docentId);
			if ($studentAccountId > 0){
				$fileId = save_document_in_database($conn, $fileParams, $userId, '1' );#mysqli_insert_id($conn);
				$result = $conn->query("INSERT INTO `releaseRequests`(`studentAccountId`, `fileId`) VALUES ('$studentAccountId','$fileId');");
			}
		}
		return $fileId;
	}
	else{
		return false;
	}
}

function save_document_in_database($conn, $file_params, $uploader_id, $privat){
	$query = "INSERT INTO `files`(`userId`, `titel`, `student`, `studiengang`, `language`, `artOfArbeit`, `jahrgang`, `betreuer`, `firma`, `sperrvermerk`, `kurzfassung`, `downloads`, `privat`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '0','$privat');";
	$stmt = $conn->prepare($query);
	$stmt->bind_param("issssssssis", $uploader_id,
																	$file_params["titel"],
																	$file_params["student"],
																	$file_params["studiengang"],
																  $file_params["language"],
																	$file_params["artOfArbeit"],
																	$file_params["jahrgang"],
																	$file_params["betreuer"],
																	$file_params["firma"],
																	$file_params["sperrvermerk"],
																	$file_params["kurzfassung"]
																	);
	$stmt->execute();
	$rv = ($conn->affected_rows > 0 ) ? $conn->insert_id : false;
	$stmt->close();
	return $rv;
}

function update_document_in_database($conn, $file_params, $fileId){
	$query = "UPDATE `files` SET `titel`=?, `student`=?, `studiengang`=?, `language`=?, `artOfArbeit`=?, `jahrgang`=?, `betreuer`=?, `firma`=?, `kurzfassung`=? WHERE `Id`=?;";
	$stmt = $conn->prepare($query);
	$stmt->bind_param("sssssssssi",
										$file_params["titel"],
										$file_params["student"],
										$file_params["studiengang"],
									  $file_params["language"],
										$file_params["artOfArbeit"],
										$file_params["jahrgang"],
										$file_params["betreuer"],
										$file_params["firma"],
										$file_params["kurzfassung"],
										$fileId);
	$stmt->execute();
	$rv = ($conn->affected_rows > 0 );
	$stmt->close();
	return $rv;
}


function saveSearchWord($fileId, $searchWordsArray){
	foreach ($schlagwoerter as $key => $value)
	{
		if ($value)
		{
			$conn->query("INSERT INTO `SearchWords` (`FileId`, `Word`) VALUES ('$fileId', '$value');");
		}
	}
}

function validateFileParams($fileParams){
	if (!(isset($fileParams["titel"]) && strlen($fileParams["titel"]) > 0)) return false;
	if (!(isset($fileParams["student"]) && strlen($fileParams["student"]) > 0)) return false;
	if (!(isset($fileParams["kurzfassung"]) && strlen($fileParams["kurzfassung"]) > 0)) return false;
	if (!(isset($fileParams["betreuer"]) && strlen($fileParams["betreuer"]) > 0)) return false;
	if (!(isset($fileParams["firma"]) && strlen($fileParams["firma"]) > 0)) return false;
	if (!(isset($fileParams["jahrgang"]) && intval($fileParams["jahrgang"]) > 1)) return false;
	//if (!(isset($fileParams["studiengang"])) && in_array($fileParams["studiengang"], $STUDIENGAENGE,strict)) return false;
	return true;
}

function isOwnerOfFile($conn,$fileId, $userId){
	$query = "SELECT Id FROM files WHERE Id=? AND UserId=$userId";
	$stmt = $conn->prepare($query);
	$stmt->bind_param("i", $fileId);
	$stmt->execute();
	$stmt->bind_result($id);
	if ($stmt->fetch()){
		$stmt->free_result();
		$stmt->close();
		return true;
	}
	else {
		$stmt->close();
		return false;
	}
}

function array_to_mysql($conn, $arr){
	$escaped_arr = array();
	foreach ($arr as $i => $a ){
		array_push($escaped_arr, $conn->real_escape_string($a));
	}
	return implode($escaped_arr, "','");
}

class UserException extends Exception { }

?>

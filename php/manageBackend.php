<?php
header("Content-Type: application/json; charset=utf-8"); // JSON-Antwort
//include_once('config.php'); // Datenbankanbindung
include_once('lib_auth.inc.php');
include_once('lib_common.inc.php');
session_start();
$_post = filter_input_array(INPUT_POST); // es werden nur POST-Variablen akzeptiert, damit nicht mittels Link (get-vars) Anderungen an DB vorgenommen werden können
$_post = replaceChars($_post);
error_log(implode(",",array_keys($_post)));
error_log(implode($_post));
$action = $_post['action'];
error_log("Action: ".$action);
check_if_csrf();

$SAVE_SUCCESSFUL= 'Speichern erfolgreich';
$SAVE_ERROR = 'Speichern fehlgeschlagen';
$DELETE_SUCCESS = 'Löschen erfolgreich' ;
$MISSING_RIGHTS_ERROR = "Nötige Berechtigungen fehlen.";
$LOGIN_REQUIERED_ERROR = "Erneuter Login erforderlich.";
$DATABASE_ERROR = 'Datenbankverbindung fehlgeschlagen';
$CREATE_ACCOUNT_SUCCESS = "Neuer Account wurde erstellt";


if (!$conn->connect_error)
{
	switch ($action)
	{
		case 'formUpload':
		{
			if (isset($_SESSION["starpl"]["user_id"]) && $_SESSION["csrf_detected"] === false)
				{
				$is_min_docent = check_if_min_dozent($_SESSION["starpl"]["user_id"]);
				$file_id = create_document($conn,$_SESSION["starpl"]["user_id"], $is_min_docent , $_post);
				$userAnswer = array();
				if ($file_id)
				{
					$schlagwoerter = $_post['schlagwort'];
					foreach ($schlagwoerter as $key => $value)
					{
						if ($value)
						{
							$value = $conn->real_escape_string($value);
							$conn->query("INSERT INTO `SearchWords` (`FileId`, `Word`) VALUES ('$file_id', '$value');");
						}
					}
					http_response_code(201);
					$userAnswer["fileId"] = $file_id;
					$userAnswer["location"] = 'http://'.$_SERVER['SERVER_NAME']."?id=".$file_id;
					if(!$is_min_docent){
						$userAnswer["location"] = $userAnswer["location"]."&hidden";
					}
				}
				else
				{
					http_response_code(400);
					$userAnswer["err"] = $SAVE_ERROR;
				}
			}
			else{
				http_response_code(403);
				$userAnswer["err"] = $LOGIN_REQUIERED_ERROR;
			}
			echo json_encode($userAnswer);
			break;
		}
		case 'fileUpload':
		{
			if (isset($_SESSION["starpl"]["user_id"]) && $_SESSION["csrf_detected"] === false )
			{
				$id = $_post['id'];
				if(check_if_min_admin($_SESSION["starpl"]["user_id"]) || is_owner_of_file($conn, $id, $_SESSION["starpl"]["user_id"]) ){
					$allowedFileTypes = array('pdf'); // diese Dateiendungen werden akzeptiert
					$dirUpload = '../upload';
					$pathNewPics = "$dirUpload/$id/";
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
		case 'formUpdateDocument':
		{
			if (isset($_SESSION["starpl"]["user_id"]) && $_SESSION["csrf_detected"] === false)
			{
				$id = $conn->real_escape_string($_post['id']);
				$answer = array();
				if(check_if_min_admin($_SESSION["starpl"]["user_id"]) || is_owner_of_file($conn, $id, $_SESSION["starpl"]["user_id"]) ){
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
					deleteFilesForDocument($id, $deleteFiles);
					$answer[0] = 1;
					$answer[1] = $DELETE_SUCCESS;
				}
				else{
					$answer[0] = 0;
					$answer[1] = $MISSING_RIGHTS_ERROR;
				}
			}
			break;
		}
		case 'getAllSearchWordsForDocument':
		{
			$docId = $_post["id"];
			$all_searchwords = getAllSearchWordsForDocument($conn,$docId);
			echo json_encode($all_searchwords);
			break;
		}

		case 'getPossibleDocents':
		{
			$user_id = $_SESSION["starpl"]["user_id"];
			$result = $conn->query("SELECT `UserName`,`userLogin`.`Id` from `studentAccounts` JOIN `userLogin` ON `userLogin`.`Id` = `DozentId` where `ExpiryDate` > NOW() AND `UserId` = '$user_id';");
			$possible_docents = array();
			$is_student_account = check_user_level($user_id, 0, "=");
			while($row = $result->fetch_assoc()){
				$possible_docents[$row["UserName"]] = $row["Id"];
			}
			$answer = array();
			$answer[0] = $is_student_account;
			$answer[1] = $possible_docents;
			echo json_encode($answer);
			break;
		}

		case 'getAllSearchWords':
		{
			$result = $conn->query("SELECT DISTINCT `Word` FROM `SearchWords`;");
			$search_words_array = array();
			while ($zeile = $result->fetch_assoc())
			{
				array_push($search_words_array, $zeile['Word']);
			}
			echo json_encode($search_words_array);
			break;
		}
		case 'getAllSearchWordsWithId':
		{
			$result = $conn->query("SELECT * FROM `SearchWords`;");
			$search_words_array = array();
			while ($zeile = $result->fetch_assoc())
			{
				array_push($search_words_array, $zeile);
			}
			echo json_encode($search_words_array);
			break;
		}
		case 'getAllDocuments':
		{
			if (isset($_SESSION["starpl"]["user_id"])){
				$user_id = $_SESSION["starpl"]["user_id"];
			}
			else{
				$queryStr = "SELECT * FROM `files` WHERE NOT `privat`  ORDER BY `titel` ASC;";
			}
			$result = $conn->query("SELECT `files`.* FROM `files` WHERE NOT `privat`   ORDER BY `titel` ASC;");
			$all_arbeiten = array();
			$i = 0;
			while ($zeile = $result->fetch_assoc())
			{
				array_push($all_arbeiten, $zeile);
				$all_arbeiten[$i]['dateien'] = get_file_names_array($zeile['Id']);
				$i++;
			}

			echo json_encode($all_arbeiten);
			break;
		}
		case 'getCreatedUsers':{
			$answer= array();
			if (isset($_SESSION["starpl"]["user_id"])){
				$user_id = $conn->real_escape_string($_SESSION["starpl"]["user_id"]);
				$result = $conn->query("SELECT `UserName`,`studentAccounts`.`Id`, `ExpiryDate`, `fileId`, `titel` FROM `studentAccounts`  JOIN `userLogin` ON `userLogin`.`Id` = `studentAccounts`.`UserId` LEFT JOIN `releaseRequests` ON `studentAccounts`.`Id` = studentAccountId LEFT JOIN `files` ON `files`.`id` = `fileId` where `DozentId` = '$user_id';");
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
		case 'deleteDocument': // gibt keine Rückmeldung aus
		{
			if (isset($_SESSION["starpl"]["user_id"]) && $_SESSION["csrf_detected"] === false)
			{
				$id = $conn->real_escape_string($_post['id']);
				$user_id = $conn->real_escape_string($_SESSION["starpl"]["user_id"]);
				if (check_if_min_admin($user_id) || is_owner_of_file($conn,$id,$_SESSION["starpl"]["user_id"]))
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

		case 'getHiddenDocument':
		{
			$file_id = $conn->real_escape_string($_post["id"]);
			$answer = array();
			if ($file_id !== 0 && $_SESSION["starpl"]["user_id"] && $_SESSION["csrf_detected"] === false) {
				$authorizationLevel = checkIfAllowedToSeeDocument($conn, $file_id, $_SESSION["starpl"]["user_id"]);
				$answer[0] = $authorizationLevel;
				if ($authorizationLevel > 0){
					$answer[1] = getFileById($conn, $file_id);
					$answer[1]["searchWords"] = getAllSearchWordsForDocument($conn, $file_id);
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
			$file_id = $conn->real_escape_string($_post["id"]);
			$answer = array();
			$user_id = $conn->real_escape_string($_SESSION["starpl"]["user_id"]);
			if ($file_id && $user_id && $_SESSION["csrf_detected"] === false){
				$updateFileStr = <<<EOT
UPDATE `files`
JOIN `releaseRequests` ON `fileId` = `files`.id
JOIN studentAccounts ON studentAccountId = studentAccounts.Id
SET `privat`= 0, `files`.UserId=$user_id
WHERE `DozentId`='$user_id' AND `fileId` = '$file_id';
EOT;
				$conn->query($updateFileStr);
				if ($conn->affected_rows > 0){
					$conn->query("DELETE FROM `releaseRequests` where `FileId` = '$file_id';");
					$answer[0] = $file_id;
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
						$user_id = checkIfUserExist($conn, $name);
						if (!$user_id){
							$userAnswer[0] = createTemporaryUserInDb($conn, $activatorId,  $name, $expiry);
							$userAnswer[1] = $CRE;
						}
						else{
							$accountId = getStudentAccountForUser($conn, $user_id, $activatorId);
							$userAnswer[0] = $accountId;
							if ($accountId == 0){
								$userAnswer[0] = createTemporaryAccountInDB($conn, $activatorId,  $user_id, $expiry);
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
					$userAnswer[1]= $MISSING_RIGHTS_ERROR;
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
						$userAnswer[1] = $MISSING_RIGHTS_ERROR;
					}
				}
				else{
					$userAnswer[0] = -1;
					$userAnswer[1] = $LOGIN_REQUIERED_ERROR;
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
					$file_id = $row["FileId"];
					$conn->query("DELETE from `files` WHERE `Id` = '$file_id'");
					deleteFilesForDocument($file_id);
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
	$userAnswer[1] = $DATABASE_ERROR;
	echo json_encode($userAnswer);
}

// überprüft, ob ein User bereits in der Datenbank existiert
function checkIfUserExist($conn, $userName)
{
	$user_id = 0;
	$result = $conn->query("SELECT `Id` FROM `userLogin` WHERE `UserName`='$userName';");
	while ($zeile = $result->fetch_assoc())
	{
		$user_id = $zeile['Id'];
	}
	return $user_id;
}

function getStudentAccountForUser($conn, $user_id, $dozentId = null){
	$queryStr = "SELECT `studentAccounts`.`Id`  FROM `studentAccounts` WHERE `userId`='$user_id'";
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

function getValidStudentAccountForUser($conn, $user_id, $dozentId = null){
	$queryStr = "SELECT `studentAccounts`.`Id`  FROM `studentAccounts` WHERE (`ExpiryDate` > NOW()) AND `userId`='$user_id'";
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
function createTemporaryAccountInDB($conn, $activatorId, $user_id, $expiry){
	$expiry_str = $expiry->format('Y-m-d H:i:s');
	$conn->query("INSERT INTO `studentAccounts` (`UserId`,`DozentId`,`ExpiryDate`) VALUES ('$user_id', '$activatorId',  '$expiry_str');");
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
	$user_id = mysqli_insert_id($conn);
	$accountId = createTemporaryAccountInDB($conn, $activatorId, $user_id, $expiry);
	return $accountId;
}

function checkIfAllowedToSeeDocument($conn, $file_id, $user_id){
	$accessLevel = 0;
	$result = $conn->query("SELECT (`DozentId`='$user_id') AS isDozent FROM `releaseRequests`  JOIN `studentAccounts` ON `studentAccounts`.Id = `studentAccountId` where `FileId` = '$file_id' AND (`UserId`='$user_id' OR `DozentId`='$user_id');");
	while($row = $result-> fetch_assoc()){
		$accessLevel = ($row["isDozent"]) ? 2 : 1;
	}
	return $accessLevel;
}


function getFileById($conn, $file_id){
	$result = $conn->query("SELECT * FROM `files` WHERE `Id` = '$file_id'; ");
	while ($file = $result->fetch_assoc())
	{
		$file['dateien'] = get_file_names_array($file['Id']);
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
			$user_id = $zeile["Id"];
			return $user_id;
		}
	}
	throw new UserException("Alle temporären Accounts dieses Nutzers sind nicht mehr gültig.");
}

// liest die Dateinamen aus dem entsprechenden Verzeichnis aus
function get_file_names_array($Id)
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
	$search_words_array = array();
	while ($zeile = $result->fetch_assoc()){
		array_push($search_words_array, $zeile["Word"]);
	}
	return $search_words_array;
}

function deleteFilesForDocument($id, $arrOfFiles=null){
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

function create_document($conn, $user_id, $uploaded_by_dozent ,$fileParams){
	if (validateFileParams($fileParams)){
		if ($uploaded_by_dozent){
			$file_id = save_document_in_database($conn, $fileParams, $user_id, '0' );#mysqli_insert_id($conn);
		}
		else {
			$docentId = $fileParams["docentId"];
			$studentAccountId = getValidStudentAccountForUser($conn, $user_id, $docentId);
			if ($studentAccountId > 0){
				$file_id = save_document_in_database($conn, $fileParams, $user_id, '1' );#mysqli_insert_id($conn);
				$result = $conn->query("INSERT INTO `releaseRequests`(`studentAccountId`, `fileId`) VALUES ('$studentAccountId','$file_id');");
			}
		}
		return $file_id;
	}
	else{
		error_log("Invalid file parameters");
		return false;
	}
}

function save_document_in_database($conn, $file_params, $uploader_id, $privat){
	$query = "INSERT INTO `files`(`userId`, `titel`, `student`, `studiengang`, `language`, `artOfArbeit`, `jahrgang`, `betreuer`, `firma`, `sperrvermerk`, `kurzfassung`, `downloads`, `privat`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '0','$privat');";
	$stmt = $conn->prepare($query);
	error_log($stmt);
	$sperrvermerk = (isset($file_params["sperrvermerk"])?$file_params["sperrvermerk"]:"0");
	$stmt->bind_param("issssssssss", $uploader_id,
																	$file_params["titel"],
																	$file_params["student"],
																	$file_params["studiengang"],
																  $file_params["language"],
																	$file_params["artOfArbeit"],
																	$file_params["jahrgang"],
																	$file_params["betreuer"],
																	$file_params["firma"],
																	$sperrvermerk,
																	$file_params["kurzfassung"]
																	);
	$stmt->execute();
	$rv = ($conn->affected_rows > 0 ) ? $conn->insert_id : false;
	$stmt->close();
	return $rv;
}

function update_document_in_database($conn, $file_params, $file_id){
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
										$file_id);
	$stmt->execute();
	$rv = ($conn->affected_rows > 0 );
	$stmt->close();
	return $rv;
}


function saveSearchWord($file_id, $search_words_array){
	foreach ($searchWordsArray as $key => $value)
	{
		if ($value)
		{
			$conn->query("INSERT INTO `SearchWords` (`FileId`, `Word`) VALUES ('$file_id', '$value');");
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

function is_owner_of_file($conn,$file_id, $user_id){
	$query = "SELECT Id FROM files WHERE Id=? AND UserId=$user_id";
	$stmt = $conn->prepare($query);
	$stmt->bind_param("i", $file_id);
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

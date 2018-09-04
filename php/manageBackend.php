<?php
header("Content-Type: application/json; charset=utf-8"); // JSON-Antwort
//include_once('config.php'); // Datenbankanbindung
include_once('lib_auth.inc.php');
include_once('lib_common.inc.php');
include_once('locales/de_DE.inc.php');
session_start();
$_post = filter_input_array(INPUT_POST);
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
$ACCOUNT_CREATE_SUCCESS = "Neuer Account wurde erstellt";
$ACCOUNT_TIMELIMIT_EXCEEDED_ERROR = "Account Zeitlimit überschritten!";
$ACCOUNT_NAME_ERROR = "Benutzername ist keine Studentenkennung";
$ACCOUNT_EXISTS_ERROR = "Studierendenaccount existiert bereits";
$ACCOUNT_UPDATE_ERROR = "Account konnte nicht aktualisiert werden.";

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
							$conn->query("INSERT INTO `search_words` (`file_id`, `word`) VALUES ('$file_id', '$value');");
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
					$path_to_files = "$dirUpload/$id/";
					mkdir("$path_to_files", 0755, true);
					foreach($_FILES as $key => $value)
					{
						$tmp_name = $value['tmp_name'];
						$name = $value['name'];
						move_uploaded_file($tmp_name, $path_to_files . $name);
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
					$delete_sws = json_decode($_post['deleteSW']);
					$delete_sws = array_to_mysql($conn, $delete_sws);
					$add_sws = json_decode($_post['addSW']);
					$conn->query("DELETE FROM `search_words` where `file_id` = '$id' AND `word` IN ('$delete_sws');");
					if ($add_sws){
						$add_sws = array_unique($add_sws);
						$existing_sws = get_all_search_words_for_document($conn, $id);
						foreach ($add_sws as $value)
						{
							//TODO: Optimize
							if (!in_array($value, $existing_sws)){
								$value = $conn->real_escape_string($value);
								$conn->query("INSERT INTO `search_words` (`file_id`, `word`) VALUES ('$id', '$value');");
							}
						}
					}
					$delete_files = json_decode($_post["delFiles"]);
					delete_files_for_document($id, $delete_files);
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
			$all_searchwords = get_all_search_words_for_document($conn,$docId);
			echo json_encode($all_searchwords);
			break;
		}

		case 'getPossibleDocents':
		{
			$user_id = $_SESSION["starpl"]["user_id"];
			$result = $conn->query("SELECT `user_name`,`user_login`.`id` from `student_accounts` JOIN `user_login` ON `user_login`.`id` = `docent_id` where `expiry_date` > NOW() AND `user_id` = '$user_id';");
			$possible_docents = array();
			$is_student_account = check_user_level($user_id, 0,true);
			while($row = $result->fetch_assoc()){
				$possible_docents[$row["user_name"]] = $row["id"];
			}
			$answer = array();
			$answer[0] = $is_student_account;
			$answer[1] = $possible_docents;
			echo json_encode($answer);
			break;
		}

		case 'getAllSearchWords':
		{
			$result = $conn->query("SELECT DISTINCT `word` FROM `search_words`;");
			$search_words_array = array();
			if ($result){
				while ($zeile = $result->fetch_assoc())
				{
					array_push($search_words_array, $zeile['word']);
				}
			}
			else {
				error_log($conn->$error);
			}
			echo json_encode($search_words_array);
			break;
		}
		case 'getAllSearchWordsWithId':
		{
			$result = $conn->query("SELECT * FROM `search_words`;");
			$search_words_array = array();
			if ( $result ){
				while ($zeile = $result->fetch_assoc())
				{
					array_push($search_words_array, $zeile);
				}
			}
			else {
				error_log($conn->$error);
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
				$queryStr = "SELECT * FROM `files` WHERE NOT `private`  ORDER BY `title` ASC;";
			}
			$result = $conn->query("SELECT `files`.* FROM `files` WHERE NOT `private`   ORDER BY `title` ASC;");
			$all_documents = array();
			$i = 0;
			if ($result){
				while ($document = $result->fetch_assoc())
					{
						$document["fb"] = $FB_NAMES[$document["fb"]];
						$document["language"] = $LANG_NAMES[$document["language"]];
						$document["type"] = $TYPE_NAMES[$document["type"]];
						array_push($all_documents, $document);
						$all_documents[$i]['dateien'] = get_file_names_array($document['id']);
						$i++;
					}
				}
			else
			{
				error_log(mysqli_error($conn));
			}

			echo json_encode($all_documents);
			break;
		}
		case 'getCreatedUsers':{
			$answer= array();
			if (isset($_SESSION["starpl"]["user_id"])){
				$user_id = $conn->real_escape_string($_SESSION["starpl"]["user_id"]);
				$result = $conn->query("SELECT `user_name`,`student_accounts`.`id`, `expiry_date`, `file_id`, `title` FROM `student_accounts`  JOIN `user_login` ON `user_login`.`id` = `student_accounts`.`user_id` LEFT JOIN `release_requests` ON `student_accounts`.`id` = student_account_id LEFT JOIN `files` ON `files`.`id` = `file_id` where `docent_id` = '$user_id';");
				$allUsers = array();
				while ($zeile = $result->fetch_assoc())
				{
					$UserName = $zeile["user_name"];
					if (!array_key_exists($UserName, $allUsers)){
						$allUsers[$UserName] = $zeile;
						unset($allUsers[$UserName]["title"], $allUsers[$UserName]["file_id"]);
						$allUsers[$UserName]["release_requests"] = [];
					}
					if($zeile["file_id"]){
						array_push($allUsers[$UserName]["release_requests"],[$zeile["file_id"], $zeile["title"]]);
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
				$result = $conn->query("SELECT * FROM `user_login` WHERE `id`='$id';");
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
					$conn->query("DELETE FROM `files` WHERE `id`='$id';");
					$conn->query("DELETE FROM `search_words` WHERE `file_id`='$id';");
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
				$authorization_level = check_allowed_to_view_document($conn, $file_id, $_SESSION["starpl"]["user_id"]);
				$answer[0] = $authorization_level;
				if ($authorization_level >= 0){
					$answer[1] = get_file_by_id($conn, $file_id);
					$answer[1]["searchWords"] = get_all_search_words_for_document($conn, $file_id);
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
				$update_file_str = <<<EOT
UPDATE `files`
JOIN `release_requests` ON `file_id` = `files`.id
JOIN student_accounts ON student_account_id = student_accounts.id
SET `private`= 0, `files`.user_id=$user_id
WHERE `docent_id`='$user_id' AND `file_id` = '$file_id';
EOT;
				$conn->query($update_file_str);
				if ($conn->affected_rows > 0){
					$conn->query("DELETE FROM `release_requests` where `file_id` = '$file_id';");
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
				$activator_id = $conn->real_escape_string($_SESSION["starpl"]["user_id"]);
				$userAnswer = array();
				if(($_SESSION["starpl"]["user_id"] > 0) && ($_SESSION["csrf_detected"] === false)){
					$name = $conn->real_escape_string($_post["username"]);
					$expiry = get_expiry_date($_post["datum_gueltig"],$_post["time_gueltig"], $maxAccountLifetime);
					if(!$expiry){
						$userAnswer[0]=0;
						$userAnswer[1]=$ACCOUNT_TIMELIMIT_EXCEEDED_ERROR;
					}
					else if (substr($name, 0, 2) != 's_'){
						$userAnswer[0] = 0;
						$userAnswer[1]=$ACCOUNT_NAME_ERROR;
					}
					else
					{
						$user_id = check_if_user_exists($conn, $name);
						if (!$user_id){
							$userAnswer[0] = createTemporaryUserInDb($conn, $activator_id,  $name, $expiry);
							$userAnswer[1] = $ACCOUNT_CREATE_SUCCESS;
						}
						else{
							$accountId = get_student_account_for_user($conn, $user_id, $activator_id);
							$userAnswer[0] = $accountId;
							if ($accountId == 0){
								$userAnswer[0] = createTemporaryAccountInDB($conn, $activator_id,  $user_id, $expiry);
								$userAnswer[1] = $ACCOUNT_CREATE_SUCCESS;
							}
							else {
								$userAnswer[0] = 0;
								$userAnswer[1]= $ACCOUNT_EXISTS_ERROR;
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
				$userAnswer[1]= $LOGIN_REQUIERED_ERROR;
			}
			echo json_encode($userAnswer);
			break;
		}

		case 'formUpdateUsers':
			{
				if(isset($_SESSION["starpl"]["user_id"]) && $_SESSION["csrf_detected"] === false){
					$activator_id = $_SESSION["starpl"]["user_id"];
					$userAnswer = array();
					if(check_if_min_dozent($_SESSION["starpl"]["user_id"])){
						$expiry = get_expiry_date($_post["datum_gueltig"],$_post["time_gueltig"], $maxAccountLifetime);
						$accountId = $conn->real_escape_string($_post["id"]);
						if(!$expiry){
							$userAnswer[0]=0;
							$userAnswer[1]=$ACCOUNT_TIMELIMIT_EXCEEDED_ERROR;
						}
						elseif (!checkIfDozentOfStudentAccount($conn, $accountId, $activator_id)) {
							$userAnswer[0]= 0;
							$userAnswer[1]=$MISSING_RIGHTS_ERROR;
						}
						else
						{
							$updateSuccesful = updateTemporaryAccount($conn, $accountId, $expiry);
							if($updateSuccesful){
								$userAnswer[0] = 1;
								$userAnswer[1] = $SAVE_SUCCESSFUL;
							}
							else {
								$userAnswer[0] = 0;
								$userAnswer[1] = $ACCOUNT_UPDATE_ERROR;
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
				$filesOfStudent = $conn->query("SELECT file_id FROM student_accounts JOIN release_requests ON `student_accounts`.`id` = student_account_id where `docent_id` = '$dozentId' AND `student_accounts`.`id`= '$accountId';");
				while ($row = $filesOfStudent->fetch_assoc()){
					$file_id = $row["file_id"];
					$conn->query("DELETE from `files` WHERE `id` = '$file_id'");
					delete_files_for_document($file_id);
				}
				$conn->query("DELETE FROM student_accounts where `docent_id` = '$dozentId' AND `id`= '$accountId'");
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
function check_if_user_exists($conn, $userName)
{
	$user_id = 0;
	$result = $conn->query("SELECT `id` FROM `user_login` WHERE `user_name`='$userName';");
	while ($zeile = $result->fetch_assoc())
	{
		$user_id = $zeile['id'];
	}
	return $user_id;
}

function get_student_account_for_user($conn, $user_id, $dozentId = null){
	$queryStr = "SELECT `student_accounts`.`id`  FROM `student_accounts` WHERE `user_id`='$user_id'";
	if ($dozentId){
		$queryStr = $queryStr . " AND `docent_id` = '$dozentId'";
	}
	$queryStr = $queryStr . ";";
	$result = $conn->query($queryStr);
	while ($row = $result->fetch_assoc()){
		return $row["id"];
	}
}

function checkIfDozentOfStudentAccount($conn, $accountId, $dozentId){
	$result = $conn->query("SELECT * FROM `student_accounts` WHERE `id` = ".$accountId." and `docent_id` = ".$dozentId.";");
	return ($result->num_rows > 0);
}

function getValidStudentAccountForUser($conn, $user_id, $dozentId = null){
	$queryStr = "SELECT `student_accounts`.`id`  FROM `student_accounts` WHERE (`expiry_date` > NOW()) AND `user_id`='$user_id'";
	if ($dozentId){
		$queryStr = $queryStr . " AND `docent_id` = '$dozentId'";
	}
	$queryStr = $queryStr . ";";
	$result = $conn->query($queryStr);
	while ($row = $result->fetch_assoc()){
		return $row["id"];
	}
}

// legt einen neuen User in der Datenbank an
function createTemporaryAccountInDB($conn, $activator_id, $user_id, $expiry){
	$expiry_str = $expiry->format('Y-m-d H:i:s');
	$conn->query("INSERT INTO `student_accounts` (`user_id`,`docent_id`,`expiry_date`) VALUES ('$user_id', '$activator_id',  '$expiry_str');");
	return mysqli_insert_id($conn);
}

function updateTemporaryAccount($conn, $accountId, $expiry){
	$expiry_str = $expiry->format('Y-m-d H:i:s');
	$conn->query("UPDATE `student_accounts` SET `expiry_date`='$expiry_str' WHERE id='$accountId'");
	return ($conn->affected_rows > 0);
}

function get_expiry_date($expiry_date, $expiry_time, $maxAccountLifetime){
	$expiry = new DateTime($expiry_date);
	$time = explode(":",$expiry_time);
	$expiry-> add(new DateInterval("PT{$time[0]}H{$time[1]}M"));
	$lifetimeLimit = new DateTime();
	$lifetimeLimit = $lifetimeLimit->add($maxAccountLifetime);
	return ($expiry <= $lifetimeLimit) ? $expiry : false;
}

function createTemporaryUserInDb($conn, $activator_id,  $user_name, $expiry ){
	global $ROLLE_STUDENT;
	$conn->query("INSERT INTO `user_login` (`user_name`, `user_role`) VALUES ('$user_name', '$ROLLE_STUDENT');");
	$user_id = mysqli_insert_id($conn);
	$accountId = createTemporaryAccountInDB($conn, $activator_id, $user_id, $expiry);
	return $accountId;
}

function check_allowed_to_view_document($conn, $file_id, $user_id){
	$accessLevel = -1;
	$result = $conn->query("SELECT (`docent_id`='$user_id') AS is_docent FROM `release_requests`  JOIN `student_accounts` ON `student_accounts`.id = `student_account_id` where `file_id` = '$file_id' AND (`user_id`='$user_id' OR `docent_id`='$user_id');");
	while($row = $result-> fetch_assoc()){
		$accessLevel = ($row["is_docent"]) ? 1 : 0;
	}
	return $accessLevel;
}


function get_file_by_id($conn, $file_id){
	global $FB_NAMES;
	global $LANG_NAMES;
	global $TYPE_NAMES;
	$result = $conn->query("SELECT * FROM `files` WHERE `id` = '$file_id'; ");
	while ($document = $result->fetch_assoc())
	{
		$document["fb"] = $FB_NAMES[$document["fb"]];
		$document["language"] = $LANG_NAMES[$document["language"]];
		$document["type"] = $TYPE_NAMES[$document["type"]];
		$document['dateien'] = get_file_names_array($document['id']);
		return $document;
	}
}

// function findTemporaryUserInDB($conn, $userName){
// 	$result = $conn->query("SELECT `user_login`.`id`,`expiry_date`, (`expiry_date` > NOW()) AS `valid` FROM `user_login` LEFT JOIN `student_accounts` ON `user_login`.id = `student_accounts`.`user_id` WHERE `user_name`='$userName';");
// 	if(!$result){
// 		throw UserException("UserName oder Passwort falsch.");
// 	}
// 	while ($zeile = $result->fetch_assoc()){
// 		if (!$zeile["ExpiryDate"]){
// 			throw new UserException("Für diesen Benutzer existieren keine gültigen Accounts");
// 		}
// 		if ($zeile["Valid"]){
// 			$user_id = $zeile["Id"];
// 			return $user_id;
// 		}
// 	}
// 	throw new UserException("Alle temporären Accounts dieses Nutzers sind nicht mehr gültig.");
// }

// liest die Dateinamen aus dem entsprechenden Verzeichnis aus
function get_file_names_array($Id)
{
	$files = array();
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
					$files[] = $file;
				}
			}
			closedir($handle);
		}
	}
	return $files;
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


function  get_all_search_words_for_document($conn,$documentId){
	$result = $conn->query("SELECT `word` FROM `search_words` where `file_id` = '$documentId';");
	$search_words_array = array();
	while ($zeile = $result->fetch_assoc()){
		array_push($search_words_array, $zeile["word"]);
	}
	return $search_words_array;
}

function delete_files_for_document($id, $file_arr=null){
	$directory = "../upload/$id/";
	if (is_dir($directory))
	{
		// öffnen des Verzeichnisses
		if ($handle = opendir($directory))
		{
			// einlesen der Verzeichnisses
			while (($file = readdir($handle)) !== false)
			{
				if($file_arr === null || in_array($file, $file_arr)){
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
			$student_account_id = getValidStudentAccountForUser($conn, $user_id, $docentId);
			if ($student_account_id > 0){
				$file_id = save_document_in_database($conn, $fileParams, $user_id, '1' );#mysqli_insert_id($conn);
				$result = $conn->query("INSERT INTO `release_requests`(`student_account_id`, `file_id`) VALUES ('$student_account_id','$file_id');");
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
	$query = "INSERT INTO `files`(`user_id`, `title`, `student`, `fb`, `language`, `type`, `year`, `docent`, `company`, `restricted`, `abstract`, `downloads`, `private`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '0','$privat');";
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
	$query = "UPDATE `files` SET `title`=?, `student`=?, `fb`=?, `language`=?, `type`=?, `year`=?, `docent`=?, `company`=?, `abstract`=? WHERE `id`=?;";
	var_dump($file_params);
	$stmt = $conn->prepare($query);
	$stmt->bind_param("sssssssssi",
										$file_params["title"],
										$file_params["student"],
										$file_params["fb"],
									  $file_params["language"],
										$file_params["type"],
										$file_params["year"],
										$file_params["docent"],
										$file_params["company"],
										$file_params["abstract"],
										$file_id);
	$stmt->execute();
	$rv = ($conn->affected_rows > 0 );
	if (!$rv){
		error_log(mysqli_error($conn));
	}
	$stmt->close();
	return $rv;
}


function saveSearchWord($file_id, $search_words_array){
	foreach ($searchWordsArray as $key => $value)
	{
		if ($value)
		{
			$conn->query("INSERT INTO `SearchWords` (`file_id`, `Word`) VALUES ('$file_id', '$value');");
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
	$query = "SELECT id FROM files WHERE id=? AND user_id=$user_id";
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

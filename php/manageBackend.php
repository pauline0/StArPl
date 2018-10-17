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
				$is_min_docent = check_if_min_docent($_SESSION["starpl"]["user_id"]);
				$file_id = create_document($conn,$_SESSION["starpl"]["user_id"], $is_min_docent , $_post);
				$user_answer = array();
				if ($file_id)
				{
					$search_words = $_post['schlagwort'];
					foreach ($search_words as $key => $value)
					{
						if ($value)
						{
							$value = $conn->real_escape_string($value);
							$conn->query("INSERT INTO `search_words` (`file_id`, `word`) VALUES ('$file_id', '$value');");
						}
					}
					http_response_code(201);
					$user_answer["fileId"] = $file_id;
					$user_answer["location"] = 'http://'.$_SERVER['SERVER_NAME']."?id=".$file_id;
					if(!$is_min_docent){
						$user_answer["location"] = $user_answer["location"]."&hidden";
					}
				}
				else
				{
					http_response_code(400);
					$user_answer["err"] = $SAVE_ERROR;
				}
			}
			else{
				http_response_code(403);
				$user_answer["err"] = $LOGIN_REQUIERED_ERROR;
			}
			echo json_encode($user_answer);
			exit;
			break;
		}
		case 'fileUpload':
		{
			if (isset($_SESSION["starpl"]["user_id"]) && $_SESSION["csrf_detected"] === false )
			{
				$id = $_post['id'];
				if(check_if_min_admin($_SESSION["starpl"]["user_id"]) || is_owner_of_file($conn, $id, $_SESSION["starpl"]["user_id"]) ){
					$dir_upload = '../upload';
					$path_to_files = "$dir_upload/$id/";
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
					$_post["restricted"] = $_post["restricted"]?:0;
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
					http_response_code(200);
					$answer[0] = 1;
					$answer[1] = $DELETE_SUCCESS;
				}
				else{
					http_response_code(403);
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
				$all_users = array();
				while ($zeile = $result->fetch_assoc())
				{
					$user_name = $zeile["user_name"];
					if (!array_key_exists($user_name, $all_users)){
						$all_users[$user_name] = $zeile;
						unset($all_users[$user_name]["title"], $all_users[$user_name]["file_id"]);
						$all_users[$user_name]["release_requests"] = [];
					}
					if($zeile["file_id"]){
						array_push($all_users[$user_name]["release_requests"],[$zeile["file_id"], $zeile["title"]]);
					}
				}
				$answer = array_values($all_users);
			}
			echo json_encode($answer);
			break;
		}

		case 'getOwnUser':
			{
			if (isset($_SESSION["starpl"]["user_id"]))
			{
				error_log("getting user");
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
				$no_user = array();
				array_push($no_user, 0);
				array_push($no_user, '');
				array_push($no_user, 0);
				array_push($answer, $no_user);
				echo json_encode($answer);
			}
			break;
		}
		case 'deleteDocument':
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
						if ($handle = opendir($directory))
						{
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
				$user_answer = array();
				if(($_SESSION["starpl"]["user_id"] > 0) && ($_SESSION["csrf_detected"] === false)){
					$name = $conn->real_escape_string($_post["username"]);
					$expiry = get_expiry_date($_post["datum_gueltig"],$_post["time_gueltig"], $max_account_lifetime);
					if(!$expiry){
						$user_answer[0]=0;
						$user_answer[1]=$ACCOUNT_TIMELIMIT_EXCEEDED_ERROR;
					}
					else if (substr($name, 0, 2) != 's_'){
						$user_answer[0] = 0;
						$user_answer[1]=$ACCOUNT_NAME_ERROR;
					}
					else
					{
						$user_id = check_if_user_exists($conn, $name);
						if (!$user_id){
							$user_answer[0] = create_temporary_user_in_db($conn, $activator_id,  $name, $expiry);
							$user_answer[1] = $ACCOUNT_CREATE_SUCCESS;
						}
						else{
							$account_id = get_student_account_for_user($conn, $user_id, $activator_id);
							$user_answer[0] = $account_id;
							if ($account_id == 0){
								$user_answer[0] = create_temporary_account_in_db($conn, $activator_id,  $user_id, $expiry);
								$user_answer[1] = $ACCOUNT_CREATE_SUCCESS;
							}
							else {
								$user_answer[0] = 0;
								$user_answer[1]= $ACCOUNT_EXISTS_ERROR;
							}
						}
					}
				}
				else{
					$user_answer[0]=0;
					$user_answer[1]= $MISSING_RIGHTS_ERROR;
				}
			}
			else {
				$user_answer[0]=0;
				$user_answer[1]= $LOGIN_REQUIERED_ERROR;
			}
			echo json_encode($user_answer);
			break;
		}

		case 'formUpdateUsers':
			{
				if(isset($_SESSION["starpl"]["user_id"]) && $_SESSION["csrf_detected"] === false){
					$activator_id = $_SESSION["starpl"]["user_id"];
					$user_answer = array();
					if(check_if_min_docent($_SESSION["starpl"]["user_id"])){
						$expiry = get_expiry_date($_post["datum_gueltig"],$_post["time_gueltig"], $max_account_lifetime);
						$account_id = $conn->real_escape_string($_post["id"]);
						if(!$expiry){
							$user_answer[0]=0;
							$user_answer[1]=$ACCOUNT_TIMELIMIT_EXCEEDED_ERROR;
						}
						elseif (!check_if_docent_of_student_account($conn, $account_id, $activator_id)) {
							$user_answer[0]= 0;
							$user_answer[1]=$MISSING_RIGHTS_ERROR;
						}
						else
						{
							$update_successful = update_temporary_account($conn, $account_id, $expiry);
							if($update_successful){
								$user_answer[0] = 1;
								$user_answer[1] = $SAVE_SUCCESSFUL;
							}
							else {
								$user_answer[0] = 0;
								$user_answer[1] = $ACCOUNT_UPDATE_ERROR;
							}
						}
					}
					else{
						$user_answer[0] = 0;
						$user_answer[1] = $MISSING_RIGHTS_ERROR;
					}
				}
				else{
					$user_answer[0] = -1;
					$user_answer[1] = $LOGIN_REQUIERED_ERROR;
				}
				echo json_encode($user_answer);
				break;
		}

		case 'deleteStudentAccount':
		{
			if ($_SESSION["csrf_detected"] === false){
				$account_id = $conn->real_escape_string($_post['id']);
				$docent_id = $_SESSION["starpl"]["user_id"];
				$answer = array();
				$files_of_student = $conn->query("SELECT file_id FROM student_accounts JOIN release_requests ON `student_accounts`.`id` = student_account_id where `docent_id` = '$docent_id' AND `student_accounts`.`id`= '$account_id';");
				while ($row = $files_of_student->fetch_assoc()){
					$file_id = $row["file_id"];
					$conn->query("DELETE from `files` WHERE `id` = '$file_id'");
					delete_files_for_document($file_id);
				}
				$conn->query("DELETE FROM student_accounts where `docent_id` = '$docent_id' AND `id`= '$account_id'");
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
			$id = $conn->real_escape_string($_post['id']);
			$query = "UPDATE `files` SET `downloads`=`downloads`+1 WHERE `id`= ?;";
			$stmt = $conn->prepare($query);
			$stmt->bind_param("i", $id);
			$stmt->execute();
			$stmt->free_result();
			$new_downloads = $conn->query("SELECT `downloads` from `files` where `id` = $id");

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
	$user_answer = array();
	$user_answer[0] = -1;
	$user_answer[1] = $DATABASE_ERROR;
	echo json_encode($user_answer);
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

function get_student_account_for_user($conn, $user_id, $docent_id = null){
	$queryStr = "SELECT `student_accounts`.`id`  FROM `student_accounts` WHERE `user_id`='$user_id'";
	if ($docent_id){
		$queryStr = $queryStr . " AND `docent_id` = '$docent_id'";
	}
	$queryStr = $queryStr . ";";
	$result = $conn->query($queryStr);
	while ($row = $result->fetch_assoc()){
		return $row["id"];
	}
}

function check_if_docent_of_student_account($conn, $account_id, $docent_id){
	$result = $conn->query("SELECT * FROM `student_accounts` WHERE `id` = ".$account_id." and `docent_id` = ".$docent_id.";");
	return ($result->num_rows > 0);
}

function get_valid_student_account_for_user($conn, $user_id, $docent_id = null){
	$queryStr = "SELECT `student_accounts`.`id`  FROM `student_accounts` WHERE (`expiry_date` > NOW()) AND `user_id`='$user_id'";
	if ($docent_id){
		$queryStr = $queryStr . " AND `docent_id` = '$docent_id'";
	}
	$queryStr = $queryStr . ";";
	$result = $conn->query($queryStr);
	while ($row = $result->fetch_assoc()){
		return $row["id"];
	}
}

// legt einen neuen User in der Datenbank an
function create_temporary_account_in_db($conn, $activator_id, $user_id, $expiry){
	$expiry_str = $expiry->format('Y-m-d H:i:s');
	$conn->query("INSERT INTO `student_accounts` (`user_id`,`docent_id`,`expiry_date`) VALUES ('$user_id', '$activator_id',  '$expiry_str');");
	return mysqli_insert_id($conn);
}

function update_temporary_account($conn, $account_id, $expiry){
	$expiry_str = $expiry->format('Y-m-d H:i:s');
	$conn->query("UPDATE `student_accounts` SET `expiry_date`='$expiry_str' WHERE id='$account_id'");
	return ($conn->affected_rows > 0);
}

function get_expiry_date($expiry_date, $expiry_time, $max_account_lifetime){
	$expiry = new DateTime($expiry_date);
	$time = explode(":",$expiry_time);
	$expiry-> add(new DateInterval("PT{$time[0]}H{$time[1]}M"));
	$lifetime_limit = new DateTime();
	$lifetime_limit = $lifetime_limit->add($max_account_lifetime);
	return ($expiry <= $lifetime_limit) ? $expiry : false;
}

function create_temporary_user_in_db($conn, $activator_id,  $user_name, $expiry ){
	global $ROLLE_STUDENT;
	$conn->query("INSERT INTO `user_login` (`user_name`, `user_role`) VALUES ('$user_name', '$ROLLE_STUDENT');");
	$user_id = mysqli_insert_id($conn);
	$account_id = create_temporary_account_in_db($conn, $activator_id, $user_id, $expiry);
	return $account_id;
}

function check_allowed_to_view_document($conn, $file_id, $user_id){
	$access_level = -1;
	$result = $conn->query("SELECT (`docent_id`='$user_id') AS is_docent FROM `release_requests`  JOIN `student_accounts` ON `student_accounts`.id = `student_account_id` where `file_id` = '$file_id' AND (`user_id`='$user_id' OR `docent_id`='$user_id');");
	while($row = $result-> fetch_assoc()){
		$access_level = ($row["is_docent"]) ? 1 : 0;
	}
	return $access_level;
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

function create_document($conn, $user_id, $uploaded_by_dozent ,$file_params){
	if (validate_file_params($file_params)){
		if ($uploaded_by_dozent){
			$file_id = save_document_in_database($conn, $file_params, $user_id, '0' );#mysqli_insert_id($conn);
		}
		else {
			$docent_id = $conn->real_escape_string($file_params["docentId"]);
			$student_account_id = get_valid_student_account_for_user($conn, $user_id, $docent_id);
			if ($student_account_id > 0){
				$file_id = save_document_in_database($conn, $file_params, $user_id, '1' );#mysqli_insert_id($conn);
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
	$restricted = (isset($file_params["restricted"])?$file_params["restricted"]:"0");
	$stmt->bind_param("issssssssss", $uploader_id,
																	$file_params["title"],
																	$file_params["student"],
																	$file_params["fb"],
																  $file_params["language"],
																	$file_params["type"],
																	$file_params["year"],
																	$file_params["docent"],
																	$file_params["company"],
																	$restricted,
																	$file_params["abstract"]
																	);
	$stmt->execute();
	// if (!$conn->set_charset('utf8')) {
	//     error_log("Error loading character set utf8: %s\n", $conn->error);
	//     exit;
	// }
	$rv = ($conn->affected_rows > 0 ) ? $conn->insert_id : false;
	if (!$rv){
		error_log("No new record...");
		error_log(mysqli_error($conn));
	}
	$stmt->close();
	return $rv;
}

function update_document_in_database($conn, $file_params, $file_id){
	$query = "UPDATE `files` SET `title`=?, `student`=?, `fb`=?, `language`=?, `type`=?, `year`=?, `docent`=?, `company`=?,`restricted`=?, `abstract`=? WHERE `id`=?;";
	var_dump($file_params);
	$stmt = $conn->prepare($query);
	$stmt->bind_param("ssssssssisi",
										$file_params["title"],
										$file_params["student"],
										$file_params["fb"],
									  $file_params["language"],
										$file_params["type"],
										$file_params["year"],
										$file_params["docent"],
										$file_params["company"],
										$file_params["restricted"],
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

function validate_file_params($file_params){
	if (!(isset($file_params["title"]) && strlen($file_params["title"]) > 0)) return false;
	if (!(isset($file_params["student"]) && strlen($file_params["student"]) > 0)) return false;
	if (!(isset($file_params["abstract"]) && strlen($file_params["abstract"]) > 0)) return false;
	if (!(isset($file_params["docent"]) && strlen($file_params["docent"]) > 0)) return false;
	if (!(isset($file_params["company"]) && strlen($file_params["company"]) > 0)) return false;
	if (!(isset($file_params["year"]) && intval($file_params["year"]) > 1)) return false;
	if (!(isset($file_params["fb"]) && intval($file_params["fb"]) >= 0 && intval($file_params["fb"]) <= 16)) return false;
	if (!(isset($file_params["type"]) && intval($file_params["type"]) >= 0 && intval($file_params["type"]) <= 2)) return false;
	if (!(isset($file_params["language"]) && intval($file_params["language"]) >= 0 && intval($file_params["language"]) <= 1)) return false;
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

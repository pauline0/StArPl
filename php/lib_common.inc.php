<?php
include_once('config.php');

$ROLLE_STUDENT=0;
$ROLLE_DOZENT=1;
$ROLLE_ADMIN=2;

function find_user_in_db($user_name)
{
  global $conn;
  $query = "SELECT id, user_role FROM user_login WHERE user_name=?;";
  $stmt = $conn->prepare($query);
  $stmt->bind_param("s", $user_name);
  $stmt->execute();
  $stmt->bind_result($user_id, $user_role);
  if ($stmt->fetch()){
    $stmt->free_result();
    $stmt->close();
    return array($user_id, $user_role);
  }
  else {
    $stmt->close();
    return null;
  }
}

function create_user_in_db($user_name, $user_role)
{
  global $conn;
  $query = "INSERT INTO user_login (user_name, user_role) VALUES (?,?);";
  $stmt = $conn->prepare($query);
  $stmt->bind_param("si", $user_name, $user_role);
  $stmt->execute();
  $stmt->close();
  return $conn->insert_id;
}

function find_temporary_user_in_db($user_name){
  global $conn;

  $query = "SELECT user_login.id , expiry_date, (`expiry_date` > NOW()) AS valid FROM user_login LEFT JOIN student_accounts ON user_login.id = student_accounts.user_id WHERE user_name=?";
  $stmt = $conn->prepare($query);
  $stmt->bind_param("s", $user_name);
  $stmt->execute();
  $stmt->bind_result($id, $expiry, $valid);
  while (mysqli_stmt_fetch($stmt)) {
    if($valid){
      $user_id = $id;
      break;
    }
  }
  $stmt->close();
  $user_id?:null;
  return $user_id;
}

function reset_authentification(){
  unset($_SESSION["starpl"]);
}

//https://funcptr.net/2013/08/25/user-sessions,-what-data-should-be-stored-where-/
function check_user_level($user_id, $level, $exact_match=false){
  global $conn;
  $op = ($exact_match) ? "=" : ">=";
  $query = "SELECT * FROM user_login WHERE id=? AND (user_role ".$op." $level) LIMIT 1";
  $stmt = $conn->prepare($query);
  $stmt->bind_param("i", $user_id);
  $stmt->execute();
  if($stmt->fetch()){
    $stmt->free_result();
    $stmt->close();
    return true;
  }
  else{
    $stmt->close();
    return false;
  }
}

function get_user_role($user_id){
  global $conn;
  $query = "SELECT user_role FROM user_login WHERE id=? LIMIT 1";
  $stmt = $conn->prepare($query);
  $stmt->bind_param("i", $user_id);
  $stmt->execute();
  $stmt->bind_result($user_role);
  if($stmt->fetch()){
    $stmt->free_result();
    $stmt->close();
    return $user_role;
  }
  else{
    $stmt->close();
    return false;
  }
}

function check_if_min_docent($user_id){
  global $ROLLE_DOZENT;
  return (isset($user_id) && check_user_level($user_id, $ROLLE_DOZENT));
}

function check_if_min_admin($user_id){
  global $ROLLE_ADMIN;
  return (isset($user_id) && check_user_level($user_id, $ROLLE_ADMIN));
}

function check_if_min_student($user_id){
  global $ROLLE_STUDENT;
  return (isset($user_id) && check_user_level($user_id, $ROLLE_STUDENT));
}

function check_if_logged_in(){
  return (isset($_SESSION["starpl"]["user_id"]));
}

function check_if_csrf(){
  if (isset($_SESSION["csrf_token"]) && ((isset($_POST["csrf_token"]) && $_POST["csrf_token"] == $_SESSION["csrf_token"]) || (isset($_GET["csrf_token"]) && $_GET["csrf_token"] == $_SESSION["csrf_token"])))
  {
      error_log("success");
      $_SESSION["csrf_detected"] = false;
  }
  else
  {
      error_log("no_success");
      $_SESSION["csrf_detected"] = true;
  }
}

function set_csrf_token(){
  //// TODO: Just for debugging purposes
  error_log($_SERVER['HTTP_USER_AGENT']);
  if(strlen(strstr($_SERVER['HTTP_USER_AGENT'],"PostmanRuntime/7.1.1")) > 0 ){
    $_SESSION["csrf_token"] = "POSTMAN_DEBUG_TOKEN";
  }
  else {
    $csrf_token = md5(uniqid(rand(), true));
    $_SESSION["csrf_token"] = $csrf_token;
  }
}

function get_fb_id($human_readable_name){
  {
    $fbs = array(
        "bank" => 1,
        "bauwesen" => 2,
        "dl" => 3,
        "elektrotechnik" => 4,
        "fm" => 5,
        "handel" => 6,
        "iba" => 7,
        "immobilien" => 8,
        "industrie" => 9,
        "informatik" => 10,
        "maschinenbau" => 11,
        "ppm" => 12,
    );
    return $kurse[substr($long_kurs, 0, 3)];
  }
}

function get_file_by_id($conn, $file_id){
	global $FB_NAMES;
	global $LANG_NAMES;
	global $TYPE_NAMES;
	$result = $conn->query("SELECT * FROM `files` WHERE `id` = '$file_id'; ");
	while ($document = $result->fetch_assoc())
	{
		#$document["fb"] = $FB_NAMES[$document["fb"]];
		$document["language"] = $LANG_NAMES[$document["language"]];
		$document["type"] = $TYPE_NAMES[$document["type"]];
		$document['dateien'] = get_file_names_array($document['id']);
		return $document;
	}
}

function  get_all_search_words_for_document($conn,$document_id){
	$result = $conn->query("SELECT `word` FROM `search_words` where `file_id` = '$document_id';");
	$search_words_array = array();
	while ($zeile = $result->fetch_assoc()){
		array_push($search_words_array, $zeile["word"]);
	}
	return $search_words_array;
}



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


?>

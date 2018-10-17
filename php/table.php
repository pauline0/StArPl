<?php
header("Content-Type: application/json; charset=utf-8"); // JSON-Antwort
include_once('lib_common.inc.php');
include_once('locales/de_DE.inc.php');

session_start();
$_get = filter_input_array(INPUT_GET);
error_log(implode(",",array_keys($_get)));
error_log(implode($_get));
$action = $_get['action'];
error_log("Action: ".$action);

if (!$conn->connect_error)
{
	switch ($action){
		case 'document':
		{
			$file_id = $conn->real_escape_string($_get["id"]);
			$answer = array();
			if ($file_id != 0) {
				$file = get_file_by_id($conn, $file_id);
				if ($file){
					$answer = $file;
					$answer["searchWords"] = get_all_search_words_for_document($conn, $file_id);
					http_response_code(200);
				}
				else {
					http_response_code(404);
				}
			}
			else{
				http_response_code(400);
			}
			echo json_encode($answer);
			die();
		}

    case "createdUsers":{
      $answer= array();
      if (isset($_SESSION["starpl"]["user_id"])){
        $user_id = $conn->real_escape_string($_SESSION["starpl"]["user_id"]);
        $result = $conn->query("SELECT `user_name`,`student_accounts`.`id`, `expiry_date`, `file_id`, `title` FROM `student_accounts`  JOIN `user_login` ON `user_login`.`id` = `student_accounts`.`user_id` LEFT JOIN `release_requests` ON `student_accounts`.`id` = student_account_id LEFT JOIN `files` ON `files`.`id` = `file_id` where `docent_id` = '$user_id';");
        $all_users = array();
        $prev_user_id = null;
        while ($row = $result->fetch_assoc())
        {
          if ($row["id"] === $prev_user_id) {
            array_push($user_row[1], [$row["file_id"], $row["title"]]);
          }
          else{
            if ($prev_user_id){
              array_push($all_users, $user_row);
            }
            $user_row = array();
            $user_row[0] = $row["user_name"];
            $user_row[1] = array();
            if ($row["file_id"] != null && $row["title"] != null){
              array_push($user_row[1],[$row["file_id"], $row["title"]]);
            }//;
            $user_row[2] = $row["expiry_date"];
            $user_row[3] = $row["id"];
            $prev_user_id = $row["id"];
          }
        }
        if($user_row){
          array_push($all_users, $user_row);
        }
        $answer["data"] = array_values($all_users);
      }
      echo json_encode($answer);
      exit;
      break;
    }

		case "documents":{
			global $ROLLE_ADMIN;
			if (isset($_SESSION["starpl"]["user_id"])){
				$user_id = $_SESSION["starpl"]["user_id"];
			}
			else{
				$user_id = null;#$queryStr = "SELECT * FROM `files` WHERE NOT `private`  ORDER BY `title` ASC;";
			}

			if (isset($_GET["fb"])){
				error_log($_GET["fb"]);
				$fb_id = intval($_GET["fb"]);
				if ($fb_id < 0 || $fb_id > 16 ) {
					$fb_id = 0;
				}
				$result = $conn->query("SELECT `files`.*, `search_words`.`word` FROM `files` join search_words on `file_id` = `files`.`id` WHERE NOT `private` AND `files`.`fb` = $fb_id ORDER BY `title` ASC;");
			}
			else {
				#TODO: Order by creation date instead of title
				$LAST_DOCUMENTS_LIMIT=10;
				$result = $conn->query("SELECT `files`.*, `search_words`.`word` FROM `files` join search_words on `file_id` = `files`.`id` INNER JOIN (SELECT `id` FROM `files` WHERE  NOT `private` ORDER BY `title` ASC LIMIT 20 ) as t1 on `files`.`id` = t1.id;");
			}
			$all_documents = array();
			$i = 0;
			$last_id = null;
			if ($result){
				$document = null;
				while ($row = $result->fetch_assoc())
					{
						if ($last_id != $row["id"]){
							if ($document){
								array_push($all_documents, $document);
							}
							$document = array('id' => $row["id"],
																'fb' => $FB_NAMES[$row["fb"]],
																'language' => $LANG_NAMES[$row["language"]],
																'type' => $TYPE_NAMES[$row["type"]],
																'search_words' => array(0 => $row["word"]),
																'student' => $row['student'],
																'company' => $row['company'],
																'title' => $row['title'],
																'docent' => $row['docent'],
																'year' => $row['year'],
																'owner' => ($user_id && ($user_id == $row['user_id'] || $user_role == $ROLLE_ADMIN) )
																);
							$last_id = $row["id"];
						}
						else {
							array_push($document['search_words'], $row["word"]);
						}
					}
				}
			else
			{
				error_log(mysqli_error($conn));
			}
			if ($document != null){
				array_push($all_documents, $document);
			}
			$answer = array('data' => $all_documents);
			echo json_encode($answer);
			break;
  	}
	}
}

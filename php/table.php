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
    case "createdUsers":{
      $answer= array();
      if (isset($_SESSION["starpl"]["user_id"])){
        $user_id = $conn->real_escape_string($_SESSION["starpl"]["user_id"]);
        $result = $conn->query("SELECT `user_name`,`student_accounts`.`id`, `expiry_date`, `file_id`, `title` FROM `student_accounts`  JOIN `user_login` ON `user_login`.`id` = `student_accounts`.`user_id` LEFT JOIN `release_requests` ON `student_accounts`.`id` = student_account_id LEFT JOIN `files` ON `files`.`id` = `file_id` where `docent_id` = '$user_id';");
        $all_users = array();
        $prev_user_id = null;
        while ($zeile = $result->fetch_assoc())
        {
          if ($zeile["id"] === $prev_user_id) {
            array_push($user_row[1], [$zeile["file_id"], $zeile["title"]]);
          }
          else{
            if ($prev_user_id){
              array_push($all_users, $user_row);
            }
            $user_row = array();
            $user_row[0] = $zeile["user_name"];
            $user_row[1] = array();
            if ($zeile["file_id"] != null && $zeile["title"] != null){
              array_push($user_row[1],[$zeile["file_id"], $zeile["title"]]);
            }//;
            $user_row[2] = $zeile["expiry_date"];
            $user_row[3] = $zeile["id"];
            $prev_user_id = $zeile["id"];
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
  }
}

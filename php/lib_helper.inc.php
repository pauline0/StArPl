<?php


function generate_options($human_readable_names, $empty=null, $values=null){
  $opt_string = ($empty == null)? "":"<option value=''>".$empty."</option>\n";
  foreach($human_readable_names as $value => $option_name){
    if($values){
      $value = $values[$value];
    }
    $opt_string =  $opt_string ."<option value='".$value."'>".$option_name."</option>\n";
  }
  return $opt_string;
}

function generate_site_navigation($fb_names){
  $sidebar_string = "";
  foreach($fb_names as $value => $option_name){
    $sidebar_string =  $sidebar_string."<li id='fb_".$value."'><a>".$option_name."</a></li>\n";
  }
  return $sidebar_string;
}


?>

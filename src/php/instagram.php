<?php
require_once 'dotenv.php';

$instagram_token = getenv("INSTAGRAM_TOKEN");

file_get_contents('https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token='.$instagram_token);

$json = file_get_contents('https://graph.instagram.com/me/media?fields=id,media_url,thumbnail_url,caption,timestamp&access_token='.$instagram_token);

header('Content-Type: application/json');
echo $json;
?>

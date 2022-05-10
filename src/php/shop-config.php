<?php
$cart_expiry_time = 1800.0;  // 30 minutes
$cart_reset_time = 2100.0;   // 35 minutes

date_default_timezone_set("Pacific/Auckland");

function uniqueId($length = 8) {
  $bytes = random_bytes(ceil($length / 2));
  return substr(bin2hex($bytes), 0, $length);
}

?>

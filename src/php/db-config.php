<?php
require_once "SleekDB/src/Store.php";
use SleekDB\Store;

$databaseDirectory = __DIR__ . "/fldb";
$databaseConfiguration = [ "timeout" => false ];

$stockStore = new Store("stock", $databaseDirectory, $databaseConfiguration);
$orderStore = new Store("orders", $databaseDirectory, $databaseConfiguration);

?>

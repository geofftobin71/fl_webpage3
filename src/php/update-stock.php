<?php
ini_set("log_errors", 1);
ini_set("display_errors", 1);
ini_set("display_startup_errors", 1);
error_reporting(E_ALL);

require_once "db-config.php";
require_once "shop-config.php";

$input = file_get_contents('php://input');
$shop_products = json_decode($input, true);

if($_SERVER['REQUEST_METHOD'] !== 'POST' || json_last_error() !== JSON_ERROR_NONE) {
  http_response_code(400);
  exit;
}

foreach($shop_products as $product) {
  foreach($product["prices"] as $price) {
    if(intval($price["stock"]) > 0) {
      $items = $stockStore->findBy([["product-id", "=", $product["id"]], "AND", ["price-id", "=", $price["id"]]]);
      for($x = 0; $x < (intVal($price["stock"]) - count($items)); $x++) {
        $stockStore->insert([
          "stock-id" => strval(uniqueId()),
          "product-id" => strval($product["id"]),
          "price-id" => strval($price["id"]),
          "updated" => microtime(true) - $cart_reset_time,
          "sold" => false
        ]);
      }
    }
  }
}

?>

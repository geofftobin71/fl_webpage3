<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");

ini_set("log_errors", 1);
ini_set("display_errors", 1);
ini_set("display_startup_errors", 1);
error_reporting(E_ALL);

require_once "db-config.php";
require_once "shop-config.php";
require_once "shop-products.php";

$input = file_get_contents('php://input');
$cart = json_decode($input, true);

if($_SERVER['REQUEST_METHOD'] !== 'POST' || json_last_error() !== JSON_ERROR_NONE) {
  http_response_code(400);
  exit;
}

$result = [];

foreach($cart as $cart_item) {
  foreach($shop_products as $product) {
    if(strval($product["id"]) == strval($cart_item["product-id"])) {
      foreach($product["prices"] as $price) {
        if(strval($price["id"]) == strval($cart_item["price-id"])) {
          array_push($result, [
            "title" => strval($product["title"]),
            "label" => strval($price["label"]),
            "price" => floatval($price["price"])
          ]);
        }
      }
    }
  }
}

echo json_encode($result);
exit;

?>

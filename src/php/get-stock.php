<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");

ini_set("log_errors", 1);
ini_set("display_errors", 1);
ini_set("display_startup_errors", 1);
error_reporting(E_ALL);

require_once "db-config.php";
require_once "shop-config.php";

$input = file_get_contents('php://input');
$product = json_decode($input, true);

if($_SERVER['REQUEST_METHOD'] !== 'POST' || json_last_error() !== JSON_ERROR_NONE) {
  http_response_code(400);
  exit;
}

$product_id = strval($product["product-id"]);
$price_id = strval($product["price-id"]);
$product_count = intval($product["product-count"]);

$stock_count = stockCount($product_id, $price_id);

if(($stock_count > 0) && ($product_count > $stock_count)) {
  echo json_encode(['error' => 'Number must be ' . $stock_count . ' or less']);
  exit;
}

if($stock_count == 0) {
  echo json_encode(['error' => 'This product has sold out']);
  exit;
}

$cart = array();

$items = acquireStock($product_id, $price_id, $product_count);

if($items) {
  foreach($items as $key => $item) {
    $cart[] = array(
      "cart-id" => uniqueId(),
      "product-id" => $item["product-id"],
      "price-id" => $item["price-id"],
      "stock-id" => $item["stock-id"],
      "updated" => $item["updated"]
    );
  }
} else {
  echo json_encode(['error' => 'Not enough stock available']);
  exit;
}

echo json_encode(['cart' => $cart]);

?>

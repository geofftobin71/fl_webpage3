<?php
$cart_expiry_time = 180.0;  // 30 minutes
$cart_reset_time = 210.0;   // 35 minutes

date_default_timezone_set("Pacific/Auckland");

function uniqueId($length = 8) {
  $bytes = random_bytes(ceil($length / 2));
  return substr(bin2hex($bytes), 0, $length);
}

function stockCount($product_id, $price_id) {
  global $stockStore;
  global $cart_expiry_time;

  $timeout = microtime(true) - $cart_expiry_time;

  $items = $stockStore->findBy([
    ["product-id", "=", $product_id],
    "AND",
    ["price-id", "=", $price_id],
    "AND",
    ["sold", "=", false],
    "AND",
    ["updated", "<", $timeout]
  ]);

  return count($items);
}

function totalStockCount($product_id) {
  global $stockStore;
  global $cart_expiry_time;

  $total_stock = 0;

  $timeout = microtime(true) - $cart_expiry_time;

  $items = $stockStore->findBy([
    ["product-id", "=", $product_id],
    "AND",
    ["sold", "=", false],
    "AND",
    ["updated", "<", $timeout]
  ]);

  $total_stock += count($items);

  return $total_stock;
}

function acquireStock($product_id, $price_id, $product_count) {
  global $stockStore;
  global $cart_expiry_time;

  $timeout = microtime(true) - $cart_expiry_time;

  $items = $stockStore->findBy([
    ["product-id", "=", $product_id],
    "AND",
    ["price-id", "=", $price_id],
    "AND",
    ["sold", "=", false],
    "AND",
    ["updated", "<", $timeout]
  ], null, $product_count);

  if(count($items) == $product_count) {
    foreach($items as $key => $item) {
      $item["updated"] = microtime(true);
      $items[$key] = $item;
    }

    $stockStore->update($items);

    return $items;
  } else {
    return null;
  }
}

?>

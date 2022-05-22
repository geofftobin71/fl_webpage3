var cart = JSON.parse(localStorage.getItem("floriade-cart")) || [];

function uid() {
  let uID = '';
  let length = 8;
  let possible = '0123456789abcdef';
  for (let i = 0; i < length; i++) {
    uID += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return uID;
};

function showViewCart() {
  if(cart.length > 0) {
    const view_cart = document.getElementById("view-cart");
    if(view_cart) {
      view_cart.style.display = "flex";
    }
  }
}

function showAddToCart() {
  const prices = document.querySelectorAll("input[name='price-id']");

  let ok = true;

  if(prices && prices.length > 1) {
    const selected_price = document.querySelector("input[name='price-id']:checked");
    if(!selected_price) { ok = false; }
  }

  if(ok) {
    const add_to_cart_button = document.getElementById("add-to-cart-button");
    if(add_to_cart_button) {
      add_to_cart_button.disabled = false;
    }
  }
}

function addToCart(product_id) {
  const prices = document.querySelectorAll("input[name='price-id']");

  let price_id;
  if(prices) {
    let price_input;
    if(prices.length > 1) {
      price_input = document.querySelector("input[name='price-id']:checked");
    } else {
      price_input = document.querySelector("input[name='price-id']");
    }
    if(price_input) {
      price_id = price_input.value;
    } else {
      location.reload();
      return;
    }
  }

  const product_count = 1;

  for(let i = 0; i < product_count; ++i) {
    cart.push({
      "cart_id": uid(),
      "product_id": product_id,
      "price_id": price_id
    });
  }

  localStorage.setItem("floriade-cart", JSON.stringify(cart));
  localStorage.setItem("floriade-cart-info", product_count + (product_count === 1 ? " item was" : " items were") + " added to your cart");
  window.location.href = "/cart/";
}

function formatMoney(price) {
  if(price === 0) { return 'free'; }
  if(Math.floor(price) === (price)) {
    return '$' + (price);
  } else {
    return '$' + (price).toFixed(2);
  }
}


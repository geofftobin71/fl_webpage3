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

function showError(message) {
  const error_msg = document.getElementById('error-msg');
  if(error_msg) {
    error_msg.innerText = message;
    error_msg.style.visibility = "visible";
  }
}

function showAddToCart() {

  let ok = true;

  const prices = document.querySelectorAll("input[name='price-id']");

  if(!prices) {
    ok = false;
  }

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

function addToCart(product_id, is_finite) {
  const prices = document.querySelectorAll("input[name='price-id']");

  if(!prices) {
    location.reload();
    return;
  }

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

  if(is_finite) {
    fetch("{{ site.php_url }}/php/get-stock.php", {
      method: "POST",
      body: JSON.stringify({
        "product-id": product_id,
        "price-id": price_id,
        "product-count": product_count
      })
    })
      .then(response => {
        console.log(response);
        if(!response.ok) {
          throw Error(response.statusText);
        }
        return response.json();
      })
      .then(json => {
        if(json.error) {
          throw Error(json.error);
        }

        if(json.cart) {
          cart = cart.concat(json.cart);
          localStorage.setItem("floriade-cart", JSON.stringify(cart));
          localStorage.setItem("floriade-cart-info", product_count + (product_count === 1 ? " item was" : " items were") + " added to your cart");
          window.location.href = "/cart/";
        }
      })
      .catch(error => {
        showError(error.message);
      });

  } else {

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
}

function formatMoney(price) {
  if(price === 0) { return 'free'; }
  if(Math.floor(price) === (price)) {
    return '$' + (price);
  } else {
    return '$' + (price).toFixed(2);
  }
}


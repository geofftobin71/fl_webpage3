function displayCart() {

  let info = localStorage.getItem("floriade-cart-info") || "";

  if(info !== "") {
    document.getElementById("info-msg").innerText = info;
    document.getElementById("info").style.display = "flex";
    localStorage.removeItem("floriade-cart-info");
  }

  if(cart.length === 0) {
    document.getElementById("empty-cart").style.display = "flex";
    return;
  }

	let cart_count = cart.length;
	let cart_items = "";
	let cart_summary = "";
  let cart_total = 0;
  let cart_data = [];

  let ok = false;

  fetch("{{ site.php_url }}/php/get-cart.php", {
    method: "POST",
    body: JSON.stringify(cart)
  }).then(function(response) {
    ok = response.ok;
    return response.json();
  }).then(function(data) {
    if(ok) {
      cart_data = data;
    	let i = 0;
      cart_data.forEach(cart_item => {
    
    	  let price = parseFloat(cart_item.price);
    
    	  cart_items += '<div class="vertical flow" style="--flow-space:0.3em">';
    	  cart_items += '<p>' + cart_item.title + '</p>';
    	
        cart_items += '<button class="horizontal middle color-shade2 font-size-300" style="margin-right:auto" aria-label="Remove item from Cart" onclick="removeFromCart(' + i + ')">';
        cart_items += '<span><svg width="1em" height="1em" aria-hidden="true" focusable="false" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M704 736v576q0 14-9 23t-23 9h-64q-14 0-23-9t-9-23v-576q0-14 9-23t23-9h64q14 0 23 9t9 23zm256 0v576q0 14-9 23t-23 9h-64q-14 0-23-9t-9-23v-576q0-14 9-23t23-9h64q14 0 23 9t9 23zm256 0v576q0 14-9 23t-23 9h-64q-14 0-23-9t-9-23v-576q0-14 9-23t23-9h64q14 0 23 9t9 23zm128 724v-948h-896v948q0 22 7 40.5t14.5 27 10.5 8.5h832q3 0 10.5-8.5t14.5-27 7-40.5zm-672-1076h448l-48-117q-7-9-17-11h-317q-10 2-17 11zm928 32v64q0 14-9 23t-23 9h-96v948q0 83-47 143.5t-113 60.5h-832q-66 0-113-58.5t-47-141.5v-952h-96q-14 0-23-9t-9-23v-64q0-14 9-23t23-9h309l70-167q15-37 54-63t79-26h320q40 0 79 26t54 63l70 167h309q14 0 23 9t9 23z"/></svg></span>&nbsp;&nbsp;remove';
    	  cart_items += '</button>';
    	  cart_items += '</div>';
    	  cart_items += '<p class="text-right">' + formatMoney(price) + '</p>';
    	
        cart_total += price;
    
    	  i++;
    	});
    	
    	cart_summary += '<p class="font-size-500 color-shade2 text-lowercase">Cart Total</p>';
    	cart_summary += '<p class="font-size-500 color-shade2" style="padding-left:2em">' + cart_count + (cart_count === 1 ? ' item' : ' items') + '</p>';
    	cart_summary += '<p class="font-size-500 text-right">' + formatMoney(cart_total) + '</p>';
    	
      document.getElementById("items").innerHTML = cart_items;
      document.getElementById("summary").innerHTML = cart_summary;
      document.getElementById("cart-form").style.display = "block";
    }
  }).catch(function(err) {
    console.error(err);
  });
}

function removeFromCart(index) {
  cart.splice(index, 1);
  let count = 1;

  localStorage.setItem("floriade-cart-info", count + (count === 1 ? " item was" : " items were") + " removed from your cart");
  localStorage.setItem("floriade-cart", JSON.stringify(cart));

  window.location.href = "/cart/";
}


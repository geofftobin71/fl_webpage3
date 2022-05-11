---
layout: layouts/page.njk
pagination:
  data: collections.shop_products
  size: 1
  alias: product
permalink: "shop/products/{{ product.data.title | slug }}/index.html"
page_sections:
  - template: javascript-warning
  - template: shop-product-section
    image_left: true
eleventyComputed:
  title: "{{ product.data.title }}"
  description: "{{ product.data.description }}"
  header_image: "{{ product.data.header_image or (product.data.images | random) }}"
  product_id: "{{ product.data.id }}"
header_no_nbsp: true
---

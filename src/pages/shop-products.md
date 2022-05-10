---
layout: layouts/page.njk
pagination:
  data: collections.shop_products
  size: 1
  alias: product
permalink: "shop/products/{{ product.data.title | slug }}/index.html"
page_sections:
  - template: shop-product-section
eleventyComputed:
  title: "{{ product.data.title }}"
  description: "{{ product.data.description }}"
  header_image: "{{ product.data.header_image or (product.data.images | random) }}"
  product_images: "{{ product.data.images }}"
  product_prices: "{{ product.data.prices }}"
  category_path: "{{ product.data.category }}"
header_no_nbsp: true
---

---
layout: layouts/page.njk
pagination:
  data: collections.shop_categories
  size: 1
  alias: category
permalink: "shop/categories/{{ category.data.title | slug }}/index.html"
eleventyComputed:
  title: "{{ category.data.title }}"
  description: "{{ category.data.description }}"
  header_image: "{{ category.data.header_image or category.data.images[0] }}"
---

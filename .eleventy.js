require("dotenv").config();

const { Settings, DateTime } = require("luxon"); 
const htmlmin = require("html-minifier");
const CleanCSS = require("clean-css");
const UglifyJS = require("uglify-js");
const jsonminify = require("jsonminify");
const markdown = require("markdown-it")({ html: true }).disable("code");
const svgContents = require("eleventy-plugin-svg-contents");
const fetch = require("node-fetch");
const EleventyFetch = require("@11ty/eleventy-fetch");
const juice = require("juice");
const crypto = require("crypto");
const glob = require("glob");
const fs = require("fs");

delete require.cache[require.resolve("./src/_data/site.js")];
const site = require("./src/_data/site.js");

Settings.defaultZoneName = "Pacific/Auckland";

var shop_products = [];

markdown.renderer.rules.image = function (tokens, idx, options, env, self) {
  const image_url = tokens[idx].attrs[0][1];
  const image_path = image_url.replace(site.cloudinary_url, "");
  const alt_txt = self.renderInlineAsText(tokens, options, env);
  const title_txt = (tokens[idx].attrs[2]) ? tokens[idx].attrs[2][1] : null;

  let caption = "";
  if(title_txt) {
    caption = '<figcaption class="caption">' + markdown.utils.escapeHtml(title_txt) + '</figcaption>';
  }

  const image_info = require("./_cache/image-info.json");
  const info = image_info.find(element => element.url == image_url);
  const width = (info && info.width) ? info.width : 800;
  const height = (info && info.height) ? info.height : 800;

  if(info && info.photographer_name) {
    if(info && info.photographer_url) {
      caption += '<figcaption class="caption small">Photo credit : <a href="' + info.photographer_url + '" target="_blank" rel="noopener">' + markdown.utils.escapeHtml(info.photographer_name) + '</a></figcaption>';
    } else {
      caption += '<figcaption class="caption small">Photo credit : ' + markdown.utils.escapeHtml(info.photographer_name) + '</figcaption>';
    }
  }

  let alt = ' alt="' + alt_txt + '"';

  return '<figure><div style="background-image:url(' + site.twic_url + image_path + '?twic=v1/output=preview)"><noscript><img ' + alt + ' src="' + site.twic_url + image_path + '?twic=v1/resize=800" /></noscript><img class="req-js"' + alt + ' src="' + site.twic_url + '/v1/placeholder:' + width + 'x' + height + ':transparent" data-twic-src="image:' + image_path + '" data-twic-step="50" data-twic-bot="contain=800x800" /></div>'
    + caption + '</figure>';
}

function uniqueId(length) {
  const buf = crypto.randomBytes(length/2);
  return buf.toString("hex");
}

module.exports = eleventyConfig => {

  eleventyConfig.on("eleventy.before", () => {

    console.log("Create unique shop IDs");

    // Create Unique IDs for shop items
    glob("./src/shop/**/*.md", (err, files) => {
      if(err) {
        console.error(err);
      } else {
        files.forEach((file) => {
          let prevStats = fs.statSync(file);
          let data = fs.readFileSync(file, "utf8");
          while(data.includes("XXXXXXXX")) {
            data = data.replace("XXXXXXXX",uniqueId(8));
          }
          fs.writeFileSync(file, data);
          fs.utimesSync(file, prevStats.atime, prevStats.mtime);
        });
      }
    });
  });

  eleventyConfig.on("eleventy.after", async () => {
    console.log("Update Stock");

    fetch(site.php_url + "/php/update-stock.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(shop_products)
    })
      .then(response => {
        if(!response.ok) { throw Error(response.statusText); }
        return response.json();
      })
      .then(json => {
        if(json.error) { throw Error(json.error); }

        console.log(JSON.stringify(json));
      })
      .catch(error => {
        console.error(error.message);
      });
  });

  eleventyConfig.setLibrary("md", markdown);

  eleventyConfig.addPlugin(svgContents);

  eleventyConfig.addPassthroughCopy({"./src/favicon/*.ico" : "/"});
  eleventyConfig.addPassthroughCopy({"./src/favicon/*.png" : "/"});
  eleventyConfig.addPassthroughCopy({"./src/favicon/*.svg" : "/"});
  eleventyConfig.addPassthroughCopy({"./src/favicon/*.xml" : "/"});
  eleventyConfig.addPassthroughCopy({"./src/favicon/*.webmanifest" : "/"});
  eleventyConfig.addPassthroughCopy("./src/fonts");
  // eleventyConfig.addPassthroughCopy("./src/images");
  eleventyConfig.addPassthroughCopy("./src/icons");
  eleventyConfig.addPassthroughCopy("./src/php");
  eleventyConfig.addPassthroughCopy("./admin");

  eleventyConfig.addTransform("juice", (content, outputPath) => {
    if(outputPath && outputPath.startsWith("dist/php/email")) {
      let juiced = juice(content);
      return juiced;
    }

    return content;
  });

  eleventyConfig.addTransform("htmlmin", (content, outputPath) => {
    if((!site.dev) && outputPath && outputPath.endsWith(".html")) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true
      });
      return minified;
    }

    return content;
  });

  eleventyConfig.addFilter("uniqueId", (length) => {
    return uniqueId(length);
  });

  eleventyConfig.addFilter("idHash", (str) => {
    crypto.createHash("md5").update(str).digest("hex");
  });

  eleventyConfig.addFilter("shuffle", (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      let temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  });

  eleventyConfig.addFilter("split", (string, delim) => {
    return string.split(delim);
  });

  eleventyConfig.addFilter("removeLongReviews", (array, limit) => {
    let filtered = [];
    for (let i = 0; i < array.length; ++i) {
      if(array[i].review.length <= limit) { filtered[filtered.length] = array[i]; }
    }
    return filtered;
  });

  eleventyConfig.addFilter("filterWeddingReviews", (array, wedding) => {
    let filtered = [];
    for (let i = 0; i < array.length; ++i) {
      if(array[i].wedding == wedding) { filtered[filtered.length] = array[i]; }
    }
    return filtered;
  });

  eleventyConfig.addFilter("cssmin", (code) => {
    if(site.dev) { return code; }

    return new CleanCSS({}).minify(code).styles;
  });

  eleventyConfig.addFilter("jsmin", (code) => {
    if(site.dev) { return code; }

    let minified = UglifyJS.minify(code);
    if( minified.error ) {
      console.error("UglifyJS error: ", minified.error);
      return code;
    }
    return minified.code;
  });

  eleventyConfig.addFilter("jsonmin", (code) => {
    if(site.dev) { return code; }

    return jsonminify(code);
  });

  eleventyConfig.addFilter("unslash", (str) => {
    return str.replaceAll("\\","");
  });

  eleventyConfig.addFilter("addNbsp", (str) => {
    let title = str.trim();
    title = title.replace(/((.*)\s(.*))$/g, "$2&nbsp;$3");
    title = title.replace(/"(.*)"/g, '\\"$1\\"');
    return title;
  });

  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat("dd LLL yyyy");
  });

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat("yyyy-LL-dd");
  });

  eleventyConfig.addFilter("sortISO8601", (array) => {
    return array.sort((a, b) => {
      return (a.timestamp < b.timestamp) ? -1 : ((a.timestamp > b.timestamp) ? 1 : 0);
    });
  });

  eleventyConfig.addFilter("externalLink", (string) => {
    return string && string.startsWith("http");
  });

  eleventyConfig.addFilter("twelveHourTime", (string) => {
    return DateTime.fromFormat(string, "HH:mm").toFormat("h:mma");
  });

  eleventyConfig.addFilter("findSpecialDay", (array, date) => {
    return array.find(element => element.date == date);
  });

  eleventyConfig.addFilter("getCategory", (categories, path) => {
    return categories.find(element => element.inputPath.replace("./","") == path);
  });

  eleventyConfig.addFilter("head", (array, n) => {
    if(!Array.isArray(array) || array.length == 0) {
      return [];
    }
    if( n < 0 ) {
      return array.slice(n);
    }

    return array.slice(0, n);
  });

  eleventyConfig.addFilter("urldecode", (string) => {
    return decodeURIComponent(string.replace(/\+/g, " "));
  });

  eleventyConfig.addFilter("iconTextButton", (svg) => {
    return (svg) ? svg.replace('<svg ', '<svg class="button-icon" aria-hidden="true" focusable="false" ') : '';
  });

  eleventyConfig.addFilter("iconButton", (svg) => {
    return (svg) ? svg.replace('<svg ', '<svg class="icon-button-icon" aria-hidden="true" focusable="false" ') : '';
  });

  eleventyConfig.addNunjucksShortcode("twic", function(args) {
    let path = (args.path) ? args.path : "";
    path = path.replace(site.cloudinary_url,"");

    let params = (args.params) ? args.params : "";
    if(args.sizes) {
      return args.sizes.map(function(size) {
        return `${site.twic_url}${path}?twic=v1/resize-max=${size}${params} ${size}w`;
      }).join(",");
    } else {
      return `${site.twic_url}${path}?twic=v1${params}`;
    }
  });

  eleventyConfig.addNunjucksShortcode("twic_dyn", function(args) {
    let path = (args.path) ? args.path : "";
    path = path.replace(site.cloudinary_url,"");

    return `image:${path}`;
  });

  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  /*
  eleventyConfig.addAsyncShortcode("markdown", async (content) => {
    const md = await markdown.render(content);
    return md;
  });

  eleventyConfig.addNunjucksAsyncFilter("markdown", async function(content, callback) {
    const md = await markdown.render(content);
    callback(null, md);
  });
  */

  eleventyConfig.addNunjucksAsyncShortcode("lqip", async function(args) {
    let path = (args.path) ? args.path : "";

    path = path.replace(site.cloudinary_url,"");

    const params = (args.params) ? args.params : "";
    const lqip_path = `${site.twic_url}${path}?twic=v1${params}/output=preview`;

    try {
      return EleventyFetch(lqip_path, {duration:"1y",type:"text",verbose:true})
        .then(data => {
          const lqip = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data);
          return (lqip);
        });
    } catch(err) {
      console.error("LQIP error: ", err);
      return (lqip_path);
    }
  });

  eleventyConfig.addNunjucksAsyncShortcode("placeholder", async function(width,height) {
    const placeholder_path = `${site.twic_url}/v1/placeholder:${width}x${height}:transparent`;

    try {
      return EleventyFetch(placeholder_path, {duration:"1y",type:"text",verbose:true})
        .then(data => {
          const placeholder = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data);
          return (placeholder);
        });
    } catch(err) {
      console.error("placeholder error: ", err);
      return (placeholder_path);
    }
  });

  eleventyConfig.addNunjucksShortcode("insta_twic", function(args) {
    let path = (args.path) ? args.path : "";
    let params = (args.params) ? args.params : "";
    if(args.sizes) {
      return args.sizes.map(function(size) {
        return path.replace(site.match_url, site.twic_url + "/instagram").replace("?", "?twic=v1/resize-max=" + size + params + "&").concat(" " + size + "w");
      }).join(",");
    } else {
      return path.replace(site.match_url, site.twic_url + "/instagram").replace("?", "?twic=v1" + params + "&");
    }
  });

  eleventyConfig.addNunjucksAsyncShortcode("insta_lqip", async function(args) {
    let path = (args.path) ? args.path : "";
    const params = (args.params) ? args.params : "";
    const lqip_path = path.replace(site.match_url, site.twic_url + "/instagram").replace("?", "?twic=v1" + params + "/output=preview&");

    try {
      return EleventyFetch(lqip_path, {duration:"1y",type:"text",verbose:true})
        .then(data => {
          const lqip = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data);
          return (lqip);
        });
    } catch(err) {
      console.error("LQIP error: ", err);
      return (lqip_path);
    }
  });

  eleventyConfig.addCollection("shop_categories", (collectionApi) => {
    const validCategory = (category) => { 
      const all_products = collectionApi.getFilteredByGlob("src/shop/products/*.md");
      const category_products = all_products.filter(element => element.data.category == category.inputPath.replace("./",""));
      const has_valid_products = category_products.find(element => element.data.disabled == false) != null;
      return (!category.data.disabled && has_valid_products);
    }

    return collectionApi.getFilteredByGlob("src/shop/categories/*.md").filter(validCategory);
  });

  eleventyConfig.addCollection("shop_products", (collectionApi) => {
    const categories = collectionApi.getFilteredByGlob("src/shop/categories/*.md");

    const validProduct = (product) => { 
      const category = categories.find(element => element.inputPath.replace("./","") == product.data.category);

      const has_valid_prices = product.data.prices.find(element => element.disabled == false) != null;

      return (!category.data.disabled && !product.data.disabled && has_valid_prices);
    }

    const products = collectionApi.getFilteredByGlob("src/shop/products/*.md").filter(validProduct);

    products.forEach((product) => {
      shop_products.push({
        title: product.data.title,
        id: product.data.id,
        category: product.data.category,
        prices: product.data.prices
      });
    });

    // console.log(JSON.stringify(shop_products));

    return products;
  });

  return {
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dir: {
      input: "src",
      output: "dist"
    }
  };
};

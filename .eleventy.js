require("dotenv").config();

const { Settings, DateTime } = require("luxon"); 
const htmlmin = require("html-minifier");
const CleanCSS = require("clean-css");
const UglifyJS = require("uglify-js");
const jsonminify = require("jsonminify");
const markdown = require("markdown-it")({ html: true }).disable("code");
const svgContents = require("eleventy-plugin-svg-contents");
const EleventyFetch = require("@11ty/eleventy-fetch");

delete require.cache[require.resolve('./src/_data/site.js')];
const site = require("./src/_data/site.js");

Settings.defaultZoneName = "Pacific/Auckland";

markdown.renderer.rules.image = function (tokens, idx, options, env, self) {
  const image_url = tokens[idx].attrs[0][1];
  const image_path = image_url.replace(site.cloudinary_url, '');
  const alt_txt = self.renderInlineAsText(tokens, options, env);
  const title_txt = (tokens[idx].attrs[2]) ? tokens[idx].attrs[2][1] : null;

  let caption = '';
  if(title_txt) {
    caption = '<figcaption class="caption">' + markdown.utils.escapeHtml(title_txt) + '</figcaption>';
  }

  const image_info = require("./_cache/image-info.json");
  const info = image_info.find(element => element.url === image_url);
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

module.exports = eleventyConfig => {

  eleventyConfig.setLibrary("md", markdown);

  eleventyConfig.addPlugin(svgContents);

  eleventyConfig.addPassthroughCopy({"./src/favicon/*.ico" : "/"});
  eleventyConfig.addPassthroughCopy({"./src/favicon/*.png" : "/"});
  eleventyConfig.addPassthroughCopy({"./src/favicon/*.svg" : "/"});
  eleventyConfig.addPassthroughCopy({"./src/favicon/*.xml" : "/"});
  eleventyConfig.addPassthroughCopy({"./src/favicon/*.webmanifest" : "/"});
  // eleventyConfig.addPassthroughCopy("./src/fonts");
  // eleventyConfig.addPassthroughCopy("./src/images");
  // eleventyConfig.addPassthroughCopy("./src/icons");
  // eleventyConfig.addPassthroughCopy("./admin");

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

  eleventyConfig.addFilter("shuffle", (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      let temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
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

  eleventyConfig.addFilter("addNbsp", (str) => {
    if (!str) {
      return;
    }
    let title = str.replace(/((.*)\s(.*))$/g, "$2&nbsp;$3");
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

  eleventyConfig.addFilter("twelveHourTime", (string) => {
    return DateTime.fromFormat(string, "HH:mm").toFormat("h:mma");
  });

  eleventyConfig.addFilter("findSpecialDay", (array, date) => {
    return array.find(element => element.date === date);
  });

  eleventyConfig.addFilter("head", (array, n) => {
    if(!Array.isArray(array) || array.length === 0) {
      return [];
    }
    if( n < 0 ) {
      return array.slice(n);
    }

    return array.slice(0, n);
  });

  eleventyConfig.addFilter("urldecode", (string) => {
    return decodeURIComponent(string.replace(/\+/g, ' '));
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
      }).join(',');
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

  eleventyConfig.addAsyncShortcode("markdown", async (content) => {
    const md = await markdown.render(content);
    return md;
  });

  eleventyConfig.addNunjucksAsyncShortcode("lqip", async function(args) {
    let path = (args.path) ? args.path : "";

    path = path.replace(site.cloudinary_url,"");

    const params = (args.params) ? args.params : "";
    const lqip_path = `${site.twic_url}${path}?twic=v1${params}/output=preview`;

    try {
      return EleventyFetch(lqip_path, {duration:"1y",type:"text",verbose:true})
        .then(data => {
          const lqip = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data);
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
          const placeholder = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data);
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
      }).join(',');
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
          const lqip = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data);
          return (lqip);
        });
    } catch(err) {
      console.error("LQIP error: ", err);
      return (lqip_path);
    }
  });

  return {
    markdownTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dir: {
      input: 'src',
      output: 'dist'
    }
  };
};

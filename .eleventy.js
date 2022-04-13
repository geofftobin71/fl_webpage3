
const htmlmin = require("html-minifier");
const CleanCSS = require("clean-css");
const UglifyJS = require("uglify-js");
const markdown = require("markdown-it")({ html: true }).disable("code");

delete require.cache[require.resolve('./src/_data/site.js')];
const site = require("./src/_data/site.js");

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

  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  eleventyConfig.addAsyncShortcode("markdown", async (content) => {
    const md = await markdown.render(content);
    return md;
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

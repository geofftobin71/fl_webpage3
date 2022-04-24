const EleventyFetch = require("@11ty/eleventy-fetch");

module.exports = async function() {

  EleventyFetch('https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=' + process.env.INSTAGRAM_TOKEN, {duration:"4w",type:"json",removeUrlQueryParams:true});
  /* .then(json => console.log(json)); */

  const json = await EleventyFetch('https://graph.instagram.com/me/media?fields=id,media_url,thumbnail_url,caption,timestamp&access_token=' + process.env.INSTAGRAM_TOKEN, {duration:"1d",type:"json",removeUrlQueryParams:true,verbose:true});

  // const data = await json.data;

  return json.data;
};


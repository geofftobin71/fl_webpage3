const EleventyFetch = require("@11ty/eleventy-fetch");

module.exports = async function() {

  const json = await EleventyFetch("http://dev.floriade.co.nz/php/instagram.php",
    {duration:"1d",type:"json",verbose:true});

  return json.data;
};


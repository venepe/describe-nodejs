require("babel-register")({
  "presets": [
    "es2015",
    "stage-0"
  ],
  "plugins": ["transform-async-to-generator"]
});
require("babel-polyfill");

// other babel configuration, if necessary

// load your app
var app = require("./app.js");

var fs = require("fs");
var config = require('../config');
var db = require('../lib/db');
var model = require('../lib/model');
var argv = require("optimist").argv;
var path = require("path");
var util = require("util");

var drop = require("./drop");
drop();

var add_user = require("./add_user");
add_user({
  "_id": "admin", 
  "roles": [
    "admin", 
    "provider", 
    "patient"
  ]
});

var add_app = require("./add_app");
add_app([
  __dirname + "/../smart-apps/public/bp-centiles/smart_manifest.json",
  __dirname + "/../smart-apps/public/cardiac-risk/smart_manifest.json",
  __dirname + "/../smart-apps/public/twinlist/smart_manifest.json"
]);

config.dbstate.on("ready", function(){
  db.shutdown();
  config.shutdown();
});

var fs = require("fs");
var config = require('../config');
var db = require('../lib/db');
var model = require('../lib/model');
var argv = require("optimist").argv;
var path = require("path");
var util = require("util");
var async = require("async");

config.dbstate.on("ready", function(){

  async.series([
    function(cb){
      var drop = require("./drop");
      drop(cb);
    },
    function(cb){
      var add_user = require("./add_user");
      add_user({
        "_id": "admin", 
        "roles": [
          "admin", 
          "provider", 
          "patient"
        ]
      }, cb);
      add_user({
        "_id": "playground-user@smartplatforms.org", 
        "roles": [
          "provider"
        ]
      }, cb);
    },    
    function(cb){
      var add_app = require("./add_app");
      add_app([
        __dirname + "/../smart-apps/public/bp-centiles/smart_manifest.json",
        __dirname + "/../smart-apps/public/growth-charts/smart_manifest.json",
        __dirname + "/../smart-apps/public/cardiac-risk/smart_manifest.json",
        __dirname + "/../smart-apps/public/twinlist/smart_manifest.json",
        __dirname + "/../smart-apps/public/your-app/smart_manifest.json"
      ], cb);
    }
  ], function(err){
		console.log("Did all the things", err);
    if(err) throw err;
    db.shutdown();
  });
});

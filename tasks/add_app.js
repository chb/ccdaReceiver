var fs = require("fs");
var config = require('../config');
var db = require('../lib/db');
var model = require('../lib/model');
var argv = require("optimist").argv;
var path = require("path");
var async = require("async");
var util = require("util");

function loadApp(a, cb){
  var p = path.join(process.cwd(), a); 
  var manifest = fs.readFileSync(a);

  manifest = manifest.toString().replace(/{{app-root}}/g, config.appServer)
  console.log(manifest);
  var app = new model.App(JSON.parse(manifest));
  app.save(cb);
};

module.exports = function(applist, cb){
  if (!util.isArray(applist)){
    applist = [applist];
  }
  async.each(applist, loadApp, cb);
};

if (require.main === module){
  module.exports(argv.app, function() {
    config.dbstate.on("ready", function(){
      db.shutdown();
    });
  });
}

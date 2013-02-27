var fs = require("fs");
var config = require('../config');
var db = require('../lib/db');
var model = require('../lib/model');
var argv = require("optimist").argv;
var path = require("path");
var util = require("util");

function loadApp(a){
  var p = path.join(process.cwd(), a); 
  var manifest = fs.readFileSync(a);

  manifest = manifest.toString().replace(/{{app-root}}/g, config.appServer)
  console.log(manifest);
  var app = new model.App(JSON.parse(manifest));
  app.save();
};

module.exports = function(applist){
  if (!util.isArray(applist)){
    applist = [applist];
  }
  applist.forEach(loadApp);
};

if (require.main === module){
  module.exports(argv.app);
  config.dbstate.on("ready", function(){
    db.shutdown();
    config.shutdown();
  });
}

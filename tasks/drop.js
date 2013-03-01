var config = require('../config');
var db = require('../lib/db');
var model = require('../lib/model');
var argv = require("optimist").argv;

module.exports = function(callback){
  model.App.collection.drop();
  model.User.collection.drop();
  model.Token.collection.drop();
  model.Authorization.collection.drop();
  config.db.patients.dropDatabase(function(err){
    if(err) throw err; 
    console.log("dropped everything");
    callback();
  });
};

if (require.main === module){
  config.dbstate.on("ready", function(){
    module.exports(function(){
      db.shutdown();
      config.shutdown();
    });
  });
}

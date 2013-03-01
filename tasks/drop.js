var config = require('../config');
var db = require('../lib/db');
var model = require('../lib/model');
var argv = require("optimist").argv;

module.exports = function(){
  model.App.collection.drop();
  model.User.collection.drop();
  model.Token.collection.drop();
  model.Authorization.collection.drop();
};

if (require.main === module){
  module.exports();
  config.dbstate.on("ready", function(){
    db.patients.dropDatabase(function(err){
      db.shutdown();
      config.shutdown();
    });
  });
}

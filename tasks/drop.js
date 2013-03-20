var config = require('../config');
var db = require('../lib/db');
var model = require('../lib/model');
var argv = require('optimist').argv;
var async = require('async');

module.exports = function(callback){
console.log("Dbd", db.auth.db.dropDatabase);
	async.series([
		db.auth.db.dropDatabase.bind(db.auth.db),
		config.db.patients.dropDatabase.bind(config.db.patients)
	] , callback)
};

if (require.main === module){
  config.dbstate.on("ready", function(){
    module.exports(function(){
      db.shutdown();
    });
  });
}

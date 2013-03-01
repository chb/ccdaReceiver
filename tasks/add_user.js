var fs = require("fs");
var config = require('../config');
var db = require('../lib/db');
var model = require('../lib/model');
var argv = require("optimist").argv;
var path = require("path");
var util = require("util");
var async = require("async");
var loadUser = loadModel(model.User);

module.exports = function(userlist, cb){
  if (!util.isArray(userlist)){
    userlist = [userlist];
  }

  async.each(userlist, loadUser, cb);
};

function loadModel(m){
  return function(v, cb) {
    console.log(v);
    var n = new m(v);
    n.save(cb);
  };
};

if (require.main === module){

  var usersById = {};

  if(argv.provider_user){
    if (!util.isArray(argv.provider_user)){
      argv.provider_user = [argv.provider_user];
    }
    argv.provider_user.forEach(function(u){
      var user = usersById[u] || (usersById[u] = {"_id": u, roles: []});
      user.roles.push("provider");
    });
  }

  if(argv.admin_user){
    if (!util.isArray(argv.admin_user)){
      argv.admin_user = [argv.admin_user];
    }
    argv.admin_user.forEach(function(u){
      var user = usersById[u] || (usersById[u] = {"_id": u, roles: []});
      user.roles.push("admin");
    });
  }

  if(argv.patient_user){
    if (!util.isArray(argv.patient_user)){
      argv.patient_user = [argv.patient_user];
    }
    argv.patient_user.forEach(function(u){
      var user = usersById[u] || (usersById[u] = {"_id": u, roles: []});
      user.roles.push("patient");
    });
  }

  var userlist =  Object.keys(usersById).map(function(u){
    return usersById[u];
  });

  module.exports(userlist, function(){
    config.dbstate.on("ready", function(){
      db.shutdown();
    });
  });
}

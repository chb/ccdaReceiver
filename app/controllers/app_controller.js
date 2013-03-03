var config = require('../../config');
var model = require('../../lib/model');

var Controller = module.exports = {};

Controller.main = function(req, res, next) {
  console.log('requesd apps');
  model.App.find(function(err, apps){
    res.json(apps);
  });
};

var config = require('../../config');

var Controller = module.exports = {};

Controller.main = function(req, res, next) {
  res.render('playground/main',
    {
      user: req.user, 
      publicUri: config.publicUri,
			nonPassportLogin: !!req.session.nonPassportLogin,
			brand: "SMART C-CDA Receiver: Playground Mode"
    });
};

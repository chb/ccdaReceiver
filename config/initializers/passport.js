var passport = require('passport')
, winston = require('winston')
, config = require('../index')
, BrowserIDStrategy = require('passport-browserid').Strategy
, async = require('async')
, model = require('../../lib/model.js');

var app = config.app;

function deserialize(email, done) {
  console.log("deflate", email);
  model.User.findOne({_id: email}, done);
};

passport.serializeUser(function(user, done) {
  winston.log("serialize",user);
  done(null, user._id);
});

passport.deserializeUser(deserialize);

function TestStrategy(email){
  this.name='test';
  this.user = email || 'test@host.com';
};

TestStrategy.prototype.authenticate = function(req){
  console.log("TEST strategy tryuot", req.query);
  if (req.query["password"] === "secret") 
  this.success({_id: req.query["email"], roles: ["provider", "admin"] });
};

if (process.env.ENVIRONMENT === "test") 
passport.use(new TestStrategy());

module.exports = function() {
  this.use(express.errorHandler());
  passport.use(new TestStrategy());

 this._routes._http.post('/auth/test', 
    passport.authenticate('test'),
    function(req, res) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(req.user));
    }
  );


}
passport.use(
  new BrowserIDStrategy({
    audience: config.publicUri
  }, function(email, done) {

    deserialize(email, function(err, user){
      if(user){
        return done(err, user);
      }

      async.auto({
        randomPatientIds: function(callback){
          config.db.patients.collection("patients", function(err, patients){
          console.log("seek random results");
  patients.find({}, {_id: true}, {limit: 3}).toArray(function(err, patients){
              patients = patients || [];
          console.log("got random results", err);
              return callback(err, patients.map(function(p){
                console.log(p);
                return p._id.match(/^(.*)\/(.*?)$/)[2];
              }));
            });
          });
        },
        newuser: ['randomPatientIds', function(callback, results){
          console.log("random results", results);
          user = new model.User({
            "_id" : email,
            "authorizedForPatients" : results.randomPatientIds,
            "recentPatients" : [ ],
            "roles" : [
            "provider",
            "patient"
            ]
          });
          console.log("saving new user");

          user.save(function(err){
            console.log("saved new user");
            done(err, user);
          });
        }]
      });

    })
  })
  );

var passport = require('passport')
, async = require('async')
, fleck = require('fleck')
, winston = require('winston')
, config = require('../index')
, BearerStrategy = require('passport-http-bearer').Strategy
, model = require('../../lib/model.js')
, oauth2dynreg = require('../../lib/oauth2-dyn-reg')
, crypto = require('crypto')
, uuid = require('node-uuid');

function password(bytes){
  var len = bytes || 32;
  return crypto.randomBytes(len).toString('hex')
};

var app = config.app;
var server = app.get('oauth2server', server);

var dynreg = oauth2dynreg.createServer();

function camelizeHashKeys(h){
  var params = {};
  Object.keys(h).forEach(function(k){
    params[fleck.camelize(k)] = h[k];
  });
  return params;
};

function replaceMongooseDoc(d, newD){
  Object.keys(d.toObject()).forEach(function(k){
    if (k !== "_id") {
      d.set(k, undefined);
    }
  });

  Object.keys(newD).forEach(function(k){
    d.set(k, newD[k]);
  });
};

function epochExpiration(d){
  return d ? Math.round(d.getTime() / 1000) : 0;
}


dynreg.register(function(clientOptions, done){
  var params = camelizeHashKeys(clientOptions);
  params._id = uuid.v4(); 
  winston.info("registering " + JSON.stringify(params));

  var app = new model.App(params); 

  var reg  = new model.AppRegistration({
    _id: params._id, 
    registrationAccessToken: password(),
    clientSecret: password()
  }); 

  async.parallel([
    app.save.bind(app), 
    reg.save.bind(reg)
    ], function(err){
      done(err, {
        client_id: app._id,
        client_secret: reg.clientSecret,
        registration_access_token: reg.registrationAccessToken,
        issued_at: epochExpiration(reg.issuedAt),
        expires_at: epochExpiration(reg.expiresAt)
      });
    });
});

dynreg.update(function(client, clientOptions, done){
  var params = camelizeHashKeys(clientOptions);

  winston.info("Updating registration for " + JSON.stringify(client));
  winston.info("Changing to:" + JSON.stringify(params));

  replaceMongooseDoc(client, params);
  client.save(function(err, doc){
    winston.info("Updated registration for " + JSON.stringify(client));
    winston.info("Err:"+err+" ; "+doc);
    done(err, {client_id: client._id});
  });

});

dynreg.rotate(function(app, done){
  winston.info("Rotating secret for " + JSON.stringify(app));
  model.AppRegistration.findOneAndUpdate(
    { _id: app._id }, 
    {
      registrationAccessToken: password(),
      clientSecret: password()
    }, function(err, reg){
      winston.info("reg logged as "+ reg.toJSON());
      return done(err, {
        client_id: app._id,
        client_secret: reg.clientSecret,
        registration_access_token: reg.registrationAccessToken,
        issued_at: epochExpiration(reg.issuedAt),
        expires_at: epochExpiration(reg.expiresAt)
      });
    });
});

passport.use('dynamicRegistrationBearer', new BearerStrategy(
  function(accessToken, done) {
    model.AppRegistration.findOne({
      registrationAccessToken: accessToken
    }).exec(function(err, registration){

      if (err) { return done(err); }

      if (!registration){
        winston.info("No accesstoken called '"+accessToken+"'.");
        return done(null, false);
      }

      winston.info("fetch dyn reg" + registration.registrationAccessToken);
      model.App.findOne({_id: registration._id})
      .exec(
        function(err, app){
          winston.info("dynRegBearer for app:" + app._id);
          done(err, app);
        });
    });
  }
));

app.post('/apps/register', [
  dynreg.authenticate('dynamicRegistrationBearer'),
  dynreg.endpoint()
]);

winston.info("post URL /apps/register");

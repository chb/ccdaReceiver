var winston = require('winston');


module.exports = {
  createServer: function createServer(passport){
    var ret = new Server();
    ret.passport = passport;
  }
}

function Server(){ };

["register", "rotate", "update"].forEach(function(k){
  Server.prototype[k] = function(f){
    this["_"+k] = f;
  };
});

Server.prototype.authenticate =  function(authMethodNames){
  var self = this;
  return function(req, res, next){
    self.passport.authenticate(
      authMethodNames,
      function(err, app){
        if (err) {return next(err);}
        // Authentication requirements for this endpoint are tolerant: 
        // depending on the 'operation' parameter, authenticated user is fine!
        req.logIn(app, {session: false}, function(err){
          if (err) { return next(err); }
        });
        next();
      })(req, res, next);
  };
};

Server.prototype.endpoint = function(){
  var self = this;

  return function(req, res, next){
    var params,
    op = req.body.operation,
    responseReqs = {
      "client_register": [
        "client_id",
        "registration_access_token"
      ],
      "client_update": ["client_id"],
      "rotate_secret": [
        "client_id",
        "registration_access_token"
      ]
    };

    function jsonResponse(err, vars){
      if (err) {return next(err);}

      var missing = [];
      responseReqs[op].forEach(function(k){
        if (vars[k] === undefined) {
          missing.push(k);
        }
      });
      if (missing.length > 0) {
        return next(new Error("Missing required response params: '" + missing.join("', '") + "'"));
      }
      res.json(vars);
    };

    winston.info(op);
    if (op === "client_register") {
      params = parseClientParams(req);
      winston.info("register new " + params.clientId);
      winston.info("calling"+ typeof self._register);
      return self._register(params, jsonResponse);
    } else if (op === "rotate_secret") {
      if (!req.user) {
        return next(new Error("'rotate_secret' requires authentication"));
      }
      return self._rotate(req.user, jsonResponse);
    } else if (op === "client_update") {
      if (!req.user) {
        return next(new Error("'client_update' requires authentication"));
      }
      params = parseClientParams(req);
      return self._update(req.user, params, jsonResponse);
    }

    return next(new Error("operation parameter must be 'client_register', 'rotate_secret', or 'client_update'."));
  };
};

function parseClientParams(req){
  var params = {};
  ["redirect_uris", "contacts"]
  .forEach(function(p){
    if(req.body[p]){
      params[p] = req.body[p].split(/\s/);
    }
  });

  [ "client_name",
    "client_url",
    "logo_url",
    "tos_url",
    "token_endpoint_auth_method",
    "policy_url",
    "jwk_url",
    "jwk_encryption_url",
    "x509_url",
    "x509_encryption_url",
    "default_max_age",
  "default_acr"]
  .forEach(function(p){
    if(req.body[p]){
      params[p] = req.body[p];
    }
  });
  return params;
};

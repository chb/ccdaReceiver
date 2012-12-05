var db = require('./db'),
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var appSchema = Schema({
  _id: {type:String, required: true},
  redirectUris: [{type: String, required: true}],
  clientName: {type: String},
  clientUrl: {type: String},
  logoUrl: {
    type: String,
    match: /\.(png|jpg|svg|gif)$/
  },
  policyUrl: {type: String},
  jwkUrl: {type: String},
  jwkEncryptionUrl: {type: String},
  x509Url: {type: String},
  x509EncryptionUrl: {type: String},
  defaultMaxAge: {type: Number},
  defaultAcr: {type: String},
  contacts: [{type: String}],
  tokenEndpointAuthMethod: {
    type: String,
    // none -> public client
    // client_secret_basic -> confidential client
    enum: ["none", "client_secret_basic", "client_secret_post"],
    default: "client_secret_basic"
  }
}, {versionKey: false});

apiAccessSchema = Schema({
  app: {type: String, ref: 'App', required: true},
  user: {type: String, ref: 'User', required: true},
  time: {
    type: Date, 
    default: Date.now
  },
  url: {type: String, required: true},
  patient: {type: String}
}, {versionKey: false});

var tokenSchema = Schema({
  _id: {type: String, required: true},
  created: {
    type: Date, 
  default: Date.now
  },
  expires: {
    type: Date, 
  default: function(){return Date.now() + 1000 * 60 * 30;}
  },
  authorization: {type: String, ref: 'Authorization'}
}, {versionKey: false});

var userSchema = Schema({
  _id: String,
  logins: Number,
  lastLogin: Date,
  roles: [{type: String, enum: ["patient", "provider", "admin"]}],
  authorizedForPatients: [String],
  recentPatients:[String]
}, {versionKey: false});

var authorizationSchema = Schema({
  _id: String,
  user: {type: String, ref: 'User'},
  app: {type: String, ref: 'App'},
  created: {
    type: Date, 
  default: Date.now
  },
  patient: {type: String}
}, {versionKey: false});

authorizationSchema.statics
.checkForPriorAuthorization = function(p, next){
  var conditions = {
    'app': p.app,
    'user': p.user,
    'patient': p.patient
  }

  this.findOne(conditions, function(err, match){
    console.log("prior auth", conditions, match);
    return next(err, match);
  });
};

var appRegistrationSchema = Schema({
  _id: {type: String, ref: 'App', required: true},
  registrationAccessToken: {type: String, required: true},
  clientSecret: {type: String, required: false},
  issuedAt: {
    type: Date, 
    default: Date.now
  },
  expiresAt: {
    type: Date, 
    required: false
  }
}, {versionKey: false});

exports.ApiAccess = db.auth.model('ApiAccess', apiAccessSchema, "api_accesses");
exports.Authorization = db.auth.model('Authorization', authorizationSchema);
exports.App = db.auth.model('App', appSchema);
exports.Token = db.auth.model('Token', tokenSchema);
exports.AppRegistration = db.auth.model('AppRegistration', appRegistrationSchema, "app_registrations");
exports.User = db.auth.model('User', userSchema);

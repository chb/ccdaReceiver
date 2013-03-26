require('../ccd');
var config =require('../../../config');
var component = require('../component');

config.dbstate.on("ready", function(){

  var Resources = [];

  Object.keys(component.registry).forEach(function(cname){

    var c = component.registry[cname];
    if(!c.parsers){
      return;
    }

    var resource = {
      name: cname,
      properties: []
    };

    c.uriTemplate && (resource.uriTemplate = c.uriTemplate);
    Resources.push(resource)
    
    c.parsers.forEach(function(p){
      var property = {};
      property.path = p.jsPath;
      property.cardinality = p.cardinality;
      property.multiple = p.multiple;
      property.required = p.required;
      if(p.component.componentName){
        property.resource = p.component.componentName;
      }
      else {
        property.primitive = p.component.jsType
      }
      resource.properties.push(property);
    });

  });

//  console.log(JSON.stringify(Resources, null,2));
  var fs = require("fs");
  var template = fs.readFileSync(__dirname+"/resources-doc.ejs").toString();
 Resources.sort(function(a,b){
  var a = a.name;
  var b = b.name;
  if (a<b) return -1;
  if (a==b) return 0;
  return 1;
 });
  var out = require("ejs").render(template, {Resources: Resources});
  console.log(out);

  config.shutdown();
});

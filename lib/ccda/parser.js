var Processor = require("./processor");
var common = require("./common");
var xpath = common.xpath;


/*
 * Parser registartion never triggering... (?) 
 XDate.parsers.push(function(t){
 });
 */

function Parser(){};
Parser.prototype.copy = function(){
  var p = new Parser();
  p.init(this.jsPath, this.cardinality, this.xpath, this.component);
  return p;
};

Parser.prototype.init = function (jsPath, cardinality, xpath, component) {
  var range = cardinality.split(/\.\./);
  var lower = range[0];
  var upper = range[range.length - 1]

  this.xpath = xpath;
  this.cardinality = cardinality;

  this.required = lower === '*' || parseInt(lower) > 0;
  this.multiple = upper === '*' || parseInt(upper) > 1;

  this.jsPath = jsPath;
  this.component = component || Processor.asString;
  return this;
};
Parser.prototype.run = function (parentTree, node) {
  var subComponent = this.component
  , matches = xpath(node, this.xpath)
  , jsVal;
  jsVal = matches.map(function(match, i) {

    if (subComponent && subComponent.componentName) {
      var subTree = new subComponent();
      subTree.topComponent = parentTree.topComponent;
      subTree.parentTree = parentTree;
      if (subTree.constructor.parsers.length > 0) {
        subTree.run(match);
      }
      else {
        // Handle the case of a SimpleCode component
        // which expects a simple string.
        subTree.run(Processor.asString(match));
      }
      return subTree;
    }
    else if (subComponent) {
      return subComponent(match);
    }
    throw "could not parse component";

  }, this);

  if (!this.multiple && jsVal.length > 1) {
    throw new Error("Found cardinality `" + jsVal.length + 
                    "` when expecting " + this.cardinality + 
                    " at " + this.xpath);
  }

  if (this.required && jsVal.length == 0) {
    var msg = parentTree.pathToTop().map(function(a){return a.constructor.componentName});
    parentTree.topComponent.errors.push("nullFlavor alert:  missing but required " + this.jsPath + " in " + msg.join(" -> "));
  }

  if (!this.multiple){
    jsVal = (jsVal.length == 0 ? null : jsVal[0]);
  }

  parentTree.setJs(this.jsPath, jsVal);
  if (this.jsPath=="sourceIds" && parentTree.js.sourceIds.length > 0) {
  }

  return this;
};

module.exports = Parser;

/*global
 Chart, GC, PointSet, Raphael, console, $,
 jQuery, debugLog,
 XDate, setTimeout*/

/*jslint eqeq: true, nomen: true, plusplus: true, forin: true, newcap: true, 
devel: true*/
(function($) {
	
	"use strict";
	
	// Dummy localStorage
	// =========================================================================
	var localStorage = window.localStorage || {
		removeItem : function(name) {
			if (name !== "removeItem" && this.hasOwnProperty(name)) {
				delete this[name];
			}
		}
	};
	
	function methods(obj, filterFn) {
		var x   = null,
			out = [],
			i   = 0;
		for (x in obj) {
			if (typeof obj[x] == "function" && 
				(!filterFn || filterFn(obj[x], x, obj))) {
				out[i++] = obj[x];
			}
		}
		return out;
	}
	
	function methodsStartingWith(obj, startsWith) {
		return methods(obj, function(fn, name, obj) {
			return name.indexOf(startsWith) === 0;
		});
	}

	// GCObject
	// =========================================================================
	function GCObject(exports) {
	
		exports.__init = function() {
			methodsStartingWith(this, "_init__").forEach(function(fn) {
				fn.call(this);
			}, this);
		};
		
		exports.__uninit = function() {
			methodsStartingWith(this, "_uninit__").forEach(function(fn) {
				fn.call(this);
			}, this);
		};
		
		return exports;
	}
	
	// Event
	// =========================================================================
	function Event(type, data) {
		
		var _isPropagationStopped = false,
			_isDefaultPrevented = false;
		
		this.type = type;
		
		this.data = $.extend({}, data);
		
		this.stopPropagation = function() {
			_isPropagationStopped = true;
		};
		
		this.isPropagationStopped = function() {
			return _isPropagationStopped;
		};
		
		this.preventDefault = function() {
			_isDefaultPrevented = true;
		};
		
		this.isDefaultPrevented = function() {
			return _isDefaultPrevented;
		};
	}
	
	// Observable Module requires GCObject
	// =========================================================================
	function Observable(exports) {
		
		var _listeners = {};
		
		exports._uninit__Observable = function() {
			this.unbind();
			_listeners = null;
		};
		
		exports.bind = function(eType, handler) {
			if (Object.prototype.toString.call(eType) != "[object Array]") {
				eType = $.trim(eType).split(/\s+/);
			}
			var l = eType.length, i, x;
			for ( i = 0; i < l; i++ ) {
				x = eType[i];
				if (!_listeners.hasOwnProperty(x)) {
					_listeners[x] = [];
				}
				_listeners[x].push(handler);
			}
			return this;
		};
	
		exports.unbind = function(eType, handler) {
			
			if (eType === undefined) {
				_listeners = {};
			}
			else { 
				var i, x, fn;
				if (eType == "*") {
					for (x in _listeners) {
						if (_listeners.hasOwnProperty(x)) {
							this.unbind(x, handler);
						}
					}	
				}
				else {
					if (_listeners[eType]) {
						if (!handler) {
							delete _listeners[eType];
						}
						else {
							for (i = _listeners[eType].length - 1; i >= 0; i--) {
								fn = _listeners[eType][i];
								if (handler === fn) {
									_listeners[eType].splice(i, 1);
								}	
							}
						}
					}
				}
			}
			return this;
		};
		
		exports.trigger = function(eType, data) {
			
			// This one is special and can only be triggered internaly
			if (eType == "*") {
				return true;	
			}
			
			var evt = new Event(eType, data), handlers, type, i, l;
			for (type in _listeners) {
				handlers = _listeners[type];
				l = handlers.length;
				for (i = 0; i < l; i++) {
					if (eType == type || type == "*") {
						handlers[i].call(exports, evt);
						if (evt.isPropagationStopped()) {
							break;
						}
					}
				}
			}
			return !evt.isDefaultPrevented();
		};
		
		return exports;
	}
	
	// Module ObjectAccessors requires Observable, GCObject
	// =========================================================================
	function ObjectAccessors(exports, props) {
		
		exports.prop = function(path, value) {
			var cur = props, 
				reg = new RegExp("\\[['\"]?([^\\]]+)['\"]?\\]", "g"),
				segments = path.replace(reg, ".$1").split("."),
				l = segments.length,
				curPath = [],
				oldValue,
				newValue,
				camelName,
				eventData,
				name,
				isNew,
				i, s;
			
		    for ( i = 0; i < l; i++ ) {
				curPath[i] = name = segments[i];
				if ( i == l - 1 ) { // last
					
					camelName = name.charAt(0).toUpperCase() + name.substr(1);
					oldValue  = cur[name];
					eventData = {
						name  : name,
						value : oldValue,
						path  : path,
						json  : props
					};
					
					// GET -----------------------------------------------------
					if ( arguments.length < 2 ) {
						
						// Try the getter first
						s = "_get__" + camelName;			
						if (this.hasOwnProperty(s) && typeof this[s] == "function") {
							return this[s]();	
						}
						
						if (!cur.hasOwnProperty(name)) {
							this.trigger("noSuchProperty", eventData);
						}
						
						return cur[name]; 
					}
					
					// DELETE --------------------------------------------------
					if (value === undefined) {
						if (cur[name] !== undefined) {
							if (this.trigger("beforeDelete", eventData)) {
								
								// Try  custom method for deletion
								s = "_unset__" + camelName;			
								if (this.hasOwnProperty(s) && typeof this[s] == "function") {
									this[s]();	
								}
								else {
									delete cur[name];
								
								}
								
								this.trigger("delete", eventData);
								
								return true;
							}
						}
						return false;
					}
					
					// SET (or CREATE) -----------------------------------------
					if (oldValue !== value) {
						
						// Check if CREATE is allowed
						if (!cur.hasOwnProperty(name)) {
							isNew = true;
							if (!this.trigger("beforeCreate", {
									name  : name,
									value : value,
									path  : path
								})
							) {
								return false;	
							}
						}
						
						// Try setter function
						s = "_set__" + camelName;
						if (this.hasOwnProperty(s) && typeof this[s] == "function") {
							cur[name] = this[s](value);
						}
						else {
							cur[name] = value;
						}
						
						newValue = this.prop(path);
						
						if (newValue !== oldValue) {
							eventData = {
								name     : name,
								newValue : newValue, 
								oldVlue  : oldValue,
								path     : path,
								json     : props
							};
							this.trigger(
								isNew ? 
									"create:" + name : 
									"set:" + name, 
								eventData
							);
							this.trigger(
								isNew ? 
									"create" : 
									"set", 
								eventData
							);
						}
						
						return true;
					}
					
					return false;
				}
				
				if (!cur.hasOwnProperty(name)) {
					
					// Called to read, but an intermediate path segment was not
					// found - return undefined
					if ( arguments.length === 1 ) {
						this.trigger("noSuchProperty", { name : curPath.join(".") });
						return undefined;
					}
					
					// Called to write, but an intermediate path segment was not
					// found - create it and continue
					cur[name] = isNaN(parseFloat(name)) || 
						String(parseFloat(name)) !== String(name) ? {} : [];
				}
				
				cur = cur[name];
			}
		};
		
		return exports;
	}
	
	// Model
	// =========================================================================
	function Model( data, readOnlyData, proxy ) {
		
		this.proxy = proxy;
		this._data = data;
		this._readOnlyData = readOnlyData;
		this.autoCommit = true;
		
		//proxy.setModel(this);
		
		GCObject(this);
		Observable(this);
		ObjectAccessors(this, data);
		
		var model         = this,
			isLocked      = false,
			changesCount  = 0,
			failuresCount = 0,
			reTry         = 10, // retry up to 10 times
			reTryAfter    = 100, // retry after 100ms
			timer         = null;
		
		/**
		 * If the changes are currently being written - schedule one more "save"
		 * to be esecuted later.
		 */
		function save() {
			
			var dfd = $.Deferred();
			
			if (timer) {
				clearTimeout(timer);
			}
			
			changesCount++;
			
			if (!isLocked) {
				isLocked = true;
				
				model.proxy.write(data)
				
				.done(function(value) {
					$.extend(true, data, value, readOnlyData);
					isLocked = false;
					reTry = 10;
					dfd.resolve(data);
					if (--changesCount > 0) {
						save();
					}
				})
				
				.fail(function(e) {
					//console.log(e);
					failuresCount++;
					isLocked = false;
					dfd.relect();
					if (--reTry >= 0) {
						timer = setTimeout(save, reTryAfter);
					}
				});
				
			} else {
				if (--reTry >= 0) {
					timer = setTimeout(save, reTryAfter);
				}
			}
			
			return dfd;
		}
		
		function sync() {
			var dfd = $.Deferred();
			model.proxy.read().done(function(serverData) {
				
				// Update the stored data because the config file is newer
				if (!serverData || !serverData.fileRevision || serverData.fileRevision < data.fileRevision) {
					data.fileRevision = data.fileRevision || 1;
					save().done(function(data) {
						dfd.resolve(data);
					});
				} 
				
				// Use the stored data because the config file is NOT newer
				else {
					dfd.resolve($.extend(true, data, serverData, readOnlyData));
				}
			});
			return dfd;
		}
		
		//initial sync.
		//sync();
		//save();
		//$("window").bind("smartready", function(e) {
		//	if (e.type == "smartready") {
		//		try {
		//			proxy.read().done(function(serverData) {
		//				$.extend(true, data, serverData.json, readOnlyData);
		//			});
		//		} catch (ex) {}
		//	}
		//});
		
		
		model.bind("set", function(e) {
			if ( model.autoCommit ) {
				save();
			}
		});
		
		//model.bind("*", function(e) {
		//	//if (GC.chartSettings.appEnvironment == "DEVELOPMENT") {
		//		console.log(e.type, e.data);
		//	//}
		//});
		
		this.save = save;
		this.sync = sync;
	}
	
	// LocalStorageProxy
	// =========================================================================
	function LocalStorageProxy(name) {
		return {
			read : function() {
				return $.when($.parseJSON(localStorage[name] || "{}"));
			},
			write : function(value) {
				localStorage[name] = JSON.stringify(value);
				return this.read();
			},
			unset : function() {
				localStorage.removeItem(name);
				return this.read();
			}
		};
	}
	
	// SmartSettingsProxy
	// =========================================================================
	function SmartSettingsProxy(name) {
		return {
			read  : GC.getPreferences,
			write : function(dataToWrite) {
				return GC.setPreferences(JSON.stringify(dataToWrite));
			},
			unset : GC.deletePreferences
		};
	}
	
	// SmartScratchpadProxy
	// =========================================================================
	function SmartScratchpadProxy(name, data, readOnlyData) {
		return {
			read  : GC.getScratchpad,
			write : function(dataToWrite) {
				return GC.setScratchpad(JSON.stringify(dataToWrite));
			},
			unset : GC.deleteScratchpad
		};
	}
	
	
	
	GC.Model                = Model;
	GC.SmartSettingsProxy   = SmartSettingsProxy;
	GC.SmartScratchpadProxy = SmartScratchpadProxy;
	GC.LocalStorageProxy    = LocalStorageProxy;
	
}(jQuery));

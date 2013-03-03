// Initialize the namespaces
GC = window.GC || {};
if (!GC.Util) {
    GC.Util = {};
}

GC.Constants = {
	DIRECTION : {
		TOP    : 2,
		RIGHT  : 4,
		BOTTOM : 8,
		LEFT   : 16
	},
	TIME_INTERVAL : {
		DAYS_IN_WEEK   : 7,
		DAYS_IN_YEAR   : 365.25,
		DAYS_IN_MONTH  : 30.4375,           // DAYS_IN_YEAR / 12
		WEEKS_IN_MONTH : 4.348214285714286, // DAYS_IN_MONTH / 7
		WEEKS_IN_YEAR  : 52.17857142857143  // DAYS_IN_YEAR / 7
	},
	TIME : {
		MILISECOND  : 1,
		MILLISECOND : 1,
		SECOND      : 1000,
		MINUTE      : 1000 * 60,
		HOUR        : 1000 * 60 * 60,
		DAY         : 1000 * 60 * 60 * 24,
		WEEK        : 1000 * 60 * 60 * 24 * 7,
		MONTH       : 1000 * 60 * 60 * 24 * 7 * 4.348214285714286,
		YEAR        : 1000 * 60 * 60 * 24 * 7 * 4.348214285714286 * 12
	},
	METRICS : {
		CENTIMETERS_IN_INCH  :     2.54,
		INCHES_IN_CENTIMETER : 1 / 2.54,
		METERS_IN_FOOT       :     0.3048,
		FOOTS_IN_METER       : 1 / 0.3048,
		KILOGRAMS_IN_POUND   :     0.45359237,
		POUNDS_IN_KILOGRAM   : 1 / 0.45359237
	}
};


// =============================================================================
// JS Engine Extensions
// =============================================================================

// forEach
if ( !Array.prototype.forEach ) {
  Array.prototype.forEach = function(fn, scope) {
  	var i, len = this.length;
    for(i = 0; i < len; i++) {
      fn.call(scope, this[i], i, this);
    }
  };
}

// indexOf
if ( !Array.prototype.indexOf ) {
	Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
		"use strict";
		if (this == null) {
			throw new TypeError();
		}
		var t = Object(this);
		var len = t.length >>> 0;
		if (len === 0) {
			return -1;
		}
		var n = 0;
		if (arguments.length > 1) {
			n = Number(arguments[1]);
			if (n != n) { // shortcut for verifying if it's NaN
				n = 0;
			} else if (n != 0 && n != Infinity && n != -Infinity) {
				n = (n > 0 || -1) * Math.floor(Math.abs(n));
			}
		}
		if (n >= len) {
			return -1;
		}
		var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
		for (; k < len; k++) {
			if (k in t && t[k] === searchElement) {
				return k;
			}
		}
		return -1;
	};
}

(function(NS) {
	
	/**
	 * Returns the float representation of the first argument or the 
	 * "defaultValue" if the float conversion is not possible.
	 * @param {*} x The argument to convert
	 * @param {*} defaultValue The fall-back return value. This is going to be 
	 *                         converted to float too.
	 * @return {Number} The resulting floating point number.
	 */
	function floatVal( x, defaultValue ) 
	{
		var out = parseFloat(x);
		if ( isNaN(out) || !isFinite(out) ) {
			out = defaultValue === undefined ? 0 : floatVal( defaultValue );
		}
		return out;
	}
	
	/**
	 * Returns the int representation of the first argument or the 
	 * "defaultValue" if the int conversion is not possible.
	 * @param {*} x The argument to convert
	 * @param {*} defaultValue The fall-back return value. This is going to be 
	 *                         converted to integer too.
	 * @return {Number} The resulting integer.
	 */
	function intVal( x, defaultValue ) 
	{
		var out = parseInt(x, 10);
		if ( isNaN(out) || !isFinite(out) ) {
			out = defaultValue === undefined ? 0 : intVal( defaultValue );
		}
		return out;
	}
	
	/**
	 * Converts the first argument to float and then rounds and returns it, or. 
	 * "defaultValue" if the int conversion is not possible. Unlike Math.round()
	 * this should never return NaN.
	 * @param {*} x The argument to convert
	 * @param {*} defaultValue The fall-back return value. This is going to be 
	 *                         converted to integer too.
	 * @return {Number} The resulting integer.
	 */
	function round( x, defaultValue )
	{
		return Math.round( floatVal( x, defaultValue ) );
	}
	
	function roundToPrecision(n, precision) {
		n = parseFloat(n);
		if ( isNaN(n) || !isFinite(n) ) {
			return Number.NaN;
		}
		if ( !precision || isNaN(precision) || !isFinite(precision) || precision < 1 ) {
			return Math.round( n );
		}
		var q = Math.pow(10, precision);
		return Math.round( n * q ) / q;
	}
	
	function cmToUS( cm, ft, inch ) {
		var inches = floatVal( cm ) * GC.Constants.METRICS.INCHES_IN_CENTIMETER;
		var feet   = Math.floor(inches / 12);
		inches     = Math.round(inches - feet * 12);
		ft   = ft   == undefined ? "ft" : ft;
		inch = inch == undefined ? "in" : inch;
		return feet + ft + " " + inches + inch;
	}
	
	function kgToUS( kg, lb, oz ) {
		var pounds = floatVal( kg ) * GC.Constants.METRICS.KILOGRAMS_IN_POUND;
		var ounces = pounds * 16;
		pounds     = Math.floor( pounds );
		ounces    -= pounds * 16;
		lb = lb == undefined ? "lb" : lb;
		oz = oz == undefined ? "oz" : oz;
		
		return pounds + lb + " " + Math.round(ounces) + oz;
	}
	
	/**
	 * Inheritance without calling the parent constructor
	 */
	function extend( base, child )
	{
		var F = function() {};
		F.prototype = base.prototype;
		F.prototype.constructor = F;
		child.prototype = new F;
	}

	
	function TaskQueue( options ) 
	{
		var cfg = $.extend({
			onChange   : $.noop,
			onComplete : $.noop
		}, options );

		var queue = [];

		function run() 
		{
			if ( queue.length ) {
				var task = queue.shift();
				cfg.onChange(task);
				task.worker(run);
			}
			else {
				cfg.onComplete();
			}
		}

		return {
			add : function( description, worker ) 
			{
				queue.push({ 
					worker      : worker, 
					description : description || "Anonimous task"
				});
				return this;
			},
			start : function() {
				run();
				return this;
			}
		};
	}
	
	var uid = (function() {
		var n = 1;
		return function() {
			return "uid_" + n++;
		};
	})();
	
	// Color Functions 
	
	function luma(c){
		var _c = Raphael.getRGB(c);
		return 0.2126 * (_c.r/255) + 
			   0.7152 * (_c.g/255) + 
			   0.0722 * (_c.b/255);
	}
	
	function mixColors(c1, c2, q) 
	{
		q = Math.min(Math.max(floatVal(q, 0.5), 0), 1);
		
		var c1 = Raphael.getRGB(c1),
			c2 = Raphael.getRGB(c2),
			q1  = q,
			q2  = 1 - q;
		return "rgb("   + round(c1.r * q1 + c2.r * q2) + 
					"," + round(c1.g * q1 + c2.g * q2) + 
					"," + round(c1.b * q1 + c2.b * q2) + ")";
	}
	
	function brighten(c, n)
	{
		var _c = Raphael.getRGB(c);
		if (_c.error) {
			return c;
		}
		
		var _n = Math.min(Math.max(floatVal(n, 0.5), 0), 1);
		return "rgb("   + round(_c.r + ( 255 - _c.r ) * _n) + 
					"," + round(_c.g + ( 255 - _c.g ) * _n) + 
					"," + round(_c.b + ( 255 - _c.b ) * _n) + ")";
	}
	
	function darken(c, n)
	{
		var _c = Raphael.getRGB(c);
		if (_c.error) {
			return c;
		}
		var _n = floatVal(n, 0.5);
		if (_n > 1) {
			_n /= 100;
		}
		_n = Math.min(Math.max(_n, 0), 1);
		return "rgb("   + round(_c.r * _n) + 
					"," + round(_c.g * _n) + 
					"," + round(_c.b * _n) + ")";
	}
	
	function readableColor( colorIn, treshold, contrast ) {
		var c = Raphael.color( colorIn );
		if ( !c.error ) {
			
			treshold = floatVal(treshold, 0.7);
			contrast = floatVal(contrast, 0.5);
			
			// use darker color
			if ( luma(colorIn) >= treshold ) {
				c.v = Math.max(0, c.v - c.v * contrast);
				c.s = Math.min(1, c.s + (1 - c.s) * contrast);
			}
			
			// use lighter color
			else {
				c.v = Math.min(1, c.v + (1 - c.v) * contrast);
				c.s = Math.max(0, c.s - c.s * contrast);
			}
			
			return Raphael.hsb(c.h, c.s, c.v);
		}
		return c.toString();
	}
	
	/**
	 * Unfortunatelly xDate and jQuery Datepicker are using differen standarts
	 * for date formatting (probably because the date-picker does not support 
	 * anything smaller than days). This function attempts to solve the problem
	 * and convert the xDate format string to jQuery-supported one.
	 */
	function cDateFormatToJqFormat(xdateFormat) {
		var map = {
			"M"    : "m",
			"MM"   : "mm",
			"MMM"  : "M",
			"MMMM" : "MM",
			"yyyy" : "yy",
			"yy"   : "y"
		};
		
		return xdateFormat.replace(/(M+|y+)/g, function(m0, m1, pos, all) {
			//console.log(arguments);
			return map[m1] || m1;
		});
	}
	
	function arrayCeil(array, value) {
		var closest, 
			len = array.length,
			cur, i;
		for ( i = 0; i < len; i++ ) {
			cur = array[i];
			if (cur >= value) {
				if ( !closest || closest > cur ) {
					closest = cur;
				}
			}
		}
		return closest;
	}
	
	function arrayFloor(array, value) {
		var closest, 
			len = array.length,
			cur, i;
		for ( i = 0; i < len; i++ ) {
			cur = array[i];
			if (cur <= value) {
				if ( !closest || closest < cur ) {
					closest = cur;
				}
			}
		}
		return closest;
	}
	
	NS.Util.floatVal   = floatVal;
	NS.Util.intVal     = intVal;
	NS.Util.round      = round;
	NS.Util.TaskQueue  = TaskQueue;
	NS.Util.luma       = luma;
	NS.Util.mixColors  = mixColors;
	NS.Util.brighten   = brighten;
	NS.Util.darken     = darken;
	NS.Util.uid        = uid;
	NS.Util.extend     = extend;
	NS.Util.cmToUS     = cmToUS;
	NS.Util.kgToUS     = kgToUS;
	NS.Util.arrayCeil  = arrayCeil;
	NS.Util.arrayFloor = arrayFloor;
	NS.Util.roundToPrecision = roundToPrecision;
	NS.Util.readableColor = readableColor;
	NS.Util.cDateFormatToJqFormat = cDateFormatToJqFormat;
	
	NS.Util.createProperty = function( obj, cfg ) {
		var UCName     = cfg.name.charAt(0).toUpperCase() + cfg.name.substr(1);
		var getterName = "get" + UCName;
		var setterName = "set" + UCName;
		var _value;
		
		obj[ getterName ] = function() {
			if ( _value === undefined ) {
				if ( cfg.getter ) {
					_value = cfg.getter.call(this);
				}
				else if ( cfg.inputName ) {
					var input = $("[name='" + cfg.inputName + "']");
					_value = input[0].type == "checkbox" || input[0].type == "radio" ? 
						input[0].checked :
						input.val();
				}
			}
			return _value;
		};
		
		obj[ setterName ] = function( value, silent ) {
			if (_value !== value) {
				var old = _value;
				if ( cfg.setter ) {
					cfg.setter.call( this, value );
					_value = this[ getterName ](value);
				} 
				else if ( cfg.inputName ) {
					var input = $("[name='" + cfg.inputName + "']");
					if (input[0].type == "checkbox" || input[0].type == "radio") {
						_value = input[0].checked = !!value;
					} else {
						_value = $("[name='" + cfg.inputName + "']").val( value ).val();
					}
				} else {
					_value = value;
				}
				
				if ( old !== _value ) {
					if (!silent ) {
						$("html").trigger("set:" + cfg.name, [value]);
						if ( cfg.inputName ) {
							$("[name='" + cfg.inputName + "']").trigger("change");
						}
					}
					if (GC[cfg.model]) {
						GC[cfg.model].prop(cfg.path || cfg.name, _value);
					}
				}
				
				old = null;
			}
		};
		
		if ( cfg.inputName ) {
			$(function() {
				$("[name='" + cfg.inputName + "']").change(function() {
					obj[ setterName ](this.type == "checkbox" || this.type == "radio" ? this.checked : this.value);
				});
			});
		}
	};

	NS.Util.createMethod = function( obj, cfg ) {
		var enablerName = "can" + cfg.name.charAt(0).toUpperCase() + cfg.name.substr(1);
		
		if ( cfg.enabler ) {
			this[enablerName] = cfg.enabler;
		}
		
		obj[ cfg.name ] = function() {
			if ( !this[enablerName] || this[enablerName].apply(this, arguments)) {
				return cfg.fn.apply(this, arguments);
			}
			return this;
		};
		
	};
	
	
	/**
	 * Class Point
	 */ 
	function Point( x, y, data ) 
	{
		this.x    = x;
		this.y    = y;
		this.data = data;
	}
	
	/**
	 * Class Rect
	 */
	function Rect( x1, y1, x2, y2, x3, y3, x4, y4 ) 
	{
		if ( arguments.length == 8 ) {
			this.pA = new Point( x1, y1 );
			this.pB = new Point( x2, y2 );
			this.pC = new Point( x3, y3 );
			this.pD = new Point( x4, y4 );
		} else {
			this.pA = new Point( x1, y1 );
			this.pB = new Point( x2, y1 );
			this.pC = new Point( x2, y2 );
			this.pD = new Point( x1, y2 );
		}
	}
	
	/**
	 * Class Collection
	 */
	function Collection()
	{
		this._items = [];
		this._length = 0;
	}
	
	Collection.prototype.add = function( item )
	{
		this._length = this._items.push( item );
		return this;
	};
	
	Collection.prototype.forEach = function( callback )
	{
		return $.each( this._items, callback );
	};
	
	
	/**
	 * Class PointSet extends Collection 
	 * Basically just an array of points
	 */
	extend( Collection, PointSet );
	function PointSet()
	{
		this._items = [];
		this._length = 0;
	}
	
	PointSet.prototype.getMaxPoint = function( direction )
	{
		var out;
		this.forEach(function(i, point) {
			switch ( direction ) {
				case GC.Constants.DIRECTION.TOP:
					if (!out || out.y < point.y) out = point;
					break;
				case GC.Constants.DIRECTION.RIGHT:
					if (!out || out.x < point.x) out = point;
					break;
				case GC.Constants.DIRECTION.BOTTOM:
					if (!out || out.y > point.y) out = point;
					break;
				case GC.Constants.DIRECTION.LEFT:
					if (!out || out.x > point.x) out = point;
					break;
			}
		}); 
		return out;
	};
	
	PointSet.prototype.getBox = function() 
	{
		return new Rect( 
			this.getMaxPoint( GC.Constants.DIRECTION.LEFT   ).x,
			this.getMaxPoint( GC.Constants.DIRECTION.TOP    ).y,
			this.getMaxPoint( GC.Constants.DIRECTION.RIGHT  ).x,
			this.getMaxPoint( GC.Constants.DIRECTION.BOTTOM ).y
		);
	};

	
	
	/**
	 * Class Line extends PointSet
	 */
	extend( PointSet, Line );
	function Line( points )
	{
		if ( !(this instanceof Line) ) {
			return new Line( points );
		}
		
		if ( $.isArray(points) ) {
			return Line.fromArray( points );
		}
		
		this.points  = [];
		this._length = 0;
	}
	
	/**
	 * Creates new line from an array of points like 
	 * [ [x, y, data], [x, y, data] ... ]
	 * @return {Line}
	 * @static
	 */
	Line.fromArray = function( arr ) {
		var line = new Line();
		$.each(arr, function(i, point) {
			line.points[i] = {
				x    : point[0],
				y    : point[1],
				data : point[2]
			};
		});
		return line;
	};
	
	/**
	 * Converts the line to array of array points like 
	 * [ [p1.x, p1.y, p1.data], [p2.x, p2.y, p2.data] ... ]
	 * @return {Array}
	 */
	Line.prototype.toArray = function() {
		var out = [];
		$.each(this.points, function(i, point) {
			out[i] = [ point.x, point.y, point.data ];
		});
		return out;
	};
	
	Line.prototype.clipRect = function( minX, maxX, minY, maxY ) {
		
	};
	
	Line.prototype.getMinX = function() {
		
	};
	Line.prototype.getMaxX = function() {
		
	};
	Line.prototype.getMinY = function() {
		
	};
	Line.prototype.getMaxY = function() {
		
	};
	Line.prototype.getSublineAtX = function() {
	
	};
	

	NS.Point      = Point;
	NS.Rect       = Rect;
	NS.Collection = Collection;
	NS.PointSet   = PointSet;
	NS.Line       = Line;
	
})(GC);



/**
* Returns the decimal representation of the years difference between d1 and d2
*
* @param {String} d1 Date string for the first date
* @param {String} d2 Date string for the second date
*
* @returns {Number} A decimal number representing the years difference
*/
var years_apart = function(d1, d2) {

    // Parse the dates
    d1 = parse_date(d1);
    d2 = parse_date(d2);
    
    // The diffYears method in XDate returns the years difference as
    // a decimal fraction
    var res = d1.diffYears(d2) ; 
    
    // The difference should always be a positive number
    return Math.abs(res);
};

/**
* Returns the age at a given date with respect to the birth date
*
* @param {String} date Date string for the current date
* @param {String} birthDate Date string for the birthday
*
* @returns {Number} The age
*/
var getAge = function  (date, birthDate) {
    // Based on http://stackoverflow.com/questions/4060004/calculate-age-in-javascript (2012-03-29)

    var d1 = parse_date(date);
    var d2 = parse_date(birthDate);
    
    var age = d1.getFullYear() - d2.getFullYear();
    var m = d1.getMonth() - d2.getMonth();
    
    if (m < 0 || (m === 0 && d1.getDate() < d2.getDate())) {
        age--;
    }
    
    return age;
};

/**
* Wrapper for dates parsing
*/
var parse_date = function(d) {
    return new XDate(d);
};

// =============================================================================
// Global functions that are just temporary here!
// =============================================================================






// Class Line extends PointSet
// =============================================================================



// =============================================================================

/**
 * Uses the Cohen�Sutherland algorithm ported to JavaScript from the C++ example
 * given here http://en.wikipedia.org/wiki/Cohen%E2%80%93Sutherland_algorithm
 */
function clipLine( x0, y0, x1, y1, minX, maxX, minY, maxY ) {
 
	var INSIDE = 0; // 0000
	var LEFT   = 1; // 0001
	var RIGHT  = 2; // 0010
	var BOTTOM = 4; // 0100
	var TOP    = 8; // 1000
	
	// Compute the bit code for a point (x, y) using the clip rectangle
	// bounded diagonally by (minX, minY), and (maxX, maxY)
	function computeOutCode( x, y ) {
		var code = INSIDE;      // initialised as being inside of clip window

		if (x < minX)           // to the left of clip window
			code |= LEFT;
		else if (x > maxX)      // to the right of clip window
			code |= RIGHT;
		if (y < minY)           // below the clip window
			code |= BOTTOM;
		else if (y > maxY)      // above the clip window
			code |= TOP;

		return code;
	}

	// Cohen�Sutherland clipping algorithm clips a line from
	// P0 = (x0, y0) to P1 = (x1, y1) against a rectangle with 
	// diagonal from (minX, minY) to (maxX, maxY).
	function cohenSutherlandLineClip( x0, y0, x1, y1 )
	{
		// compute outcodes for P0, P1, and whatever point lies outside the clip rectangle
		var outcode0 = computeOutCode(x0, y0);
		var outcode1 = computeOutCode(x1, y1);
		var accept   = false;

		while (true) {
			if (!(outcode0 | outcode1)) { // Bitwise OR is 0. Trivially accept and get out of loop
				accept = true;
				break;
			} else if (outcode0 & outcode1) { // Bitwise AND is not 0. Trivially reject and get out of loop
				break;
			} else {
				// failed both tests, so calculate the line segment to clip
				// from an outside point to an intersection with clip edge
				var x, y;

				// At least one endpoint is outside the clip rectangle; pick it.
				var outcodeOut = outcode0 ? outcode0 : outcode1;

				// Now find the intersection point;
				// use formulas y = y0 + slope * (x - x0), 
				//              x = x0 + (1 / slope) * (y - y0)
				if (outcodeOut & TOP) {           // point is above the clip rectangle
					x = x0 + (x1 - x0) * (maxY - y0) / (y1 - y0);
					y = maxY;
				} else if (outcodeOut & BOTTOM) { // point is below the clip rectangle
					x = x0 + (x1 - x0) * (minY - y0) / (y1 - y0);
					y = minY;
				} else if (outcodeOut & RIGHT) {  // point is to the right of clip rectangle
					y = y0 + (y1 - y0) * (maxX - x0) / (x1 - x0);
					x = maxX;
				} else /*if (outcodeOut & LEFT)*/ {   // point is to the left of clip rectangle
					y = y0 + (y1 - y0) * (minX - x0) / (x1 - x0);
					x = minX;
				}
				
				// Now we move outside point to intersection point to clip
				// and get ready for next pass.
				if (outcodeOut == outcode0) {
					x0 = x;
					y0 = y;
					outcode0 = computeOutCode(x0, y0);
				} else {
					x1 = x;
					y1 = y;
					outcode1 = computeOutCode(x1, y1);
				}
			}
		}

		return accept ? [ x0, y0, x1, y1 ] : false;
	}
	
	return cohenSutherlandLineClip( x0, y0, x1, y1 );
}


function getLineYatX( line, x ) {
	var len         = line.length,
		pointBefore = null,
		pointAfter  = null,
		point, j;
	
	for ( j = 0; j < len; j++ ) {
		point = line[j];
		
		if ( point[0] < x ) {
			if ( !pointBefore || pointBefore[0] <= point[0] ) {
				pointBefore = [ point[0], point[1] ];
			}
		}
		
		if ( point[0] > x ) {
			if ( !pointAfter || pointAfter[0] >= point[0] ) {
				pointAfter = [ point[0], point[1] ];
			}
		}
	}
	
	if (!pointBefore)
		pointBefore = line[0];
	
	if (!pointAfter)
		pointAfter = line[len - 1];
	
	return getYatX( x, pointBefore[0], pointBefore[1], pointAfter[0], pointAfter[1] );
}

function getLineXatY( line, y ) {
	var len         = line.length,
		pointBefore = null,
		pointAfter  = null,
		point, j;
	
	for ( j = 0; j < len; j++ ) {
		point = line[j];
		
		if ( point[1] < y ) {
			if ( !pointBefore || pointBefore[1] <= point[1] ) {
				pointBefore = [ point[0], point[1] ];
			}
		}
		
		if ( point[1] > y ) {
			if ( !pointAfter || pointAfter[1] >= point[1] ) {
				pointAfter = [ point[0], point[1] ];
			}
		}
	}
	
	if (!pointBefore)
		pointBefore = line[0];
	
	if (!pointAfter)
		pointAfter = line[len - 1];
	
	return getXatY( y, pointBefore[0], pointBefore[1], pointAfter[0], pointAfter[1] );
}

function getLinesMinDistanceY( l1, l2, precision )
{
	precision = Math.abs( GC.Util.round( precision, 10 ) );
	
	var len1 = l1.length,
		len2 = l2.length;
	
	if ( len1 > 1 && len2 > 1 ) {
		
		var range1   = findMinMax(l1, 0),
			range2   = findMinMax(l2, 0),
			minX     = Math.min(range1.min, range2.min),
			maxX     = Math.max(range1.max, range2.max),
			range    = maxX - minX,
			step     = range / (precision + 1),
			distance = Number.MAX_VALUE,
			d,
			x, 
			y1, y2, p1 = new GC.Point(), p2 = new GC.Point(), points = [];
		
		for ( x = minX; x < maxX + step; x += step ) {
			
			var exit = false;
			if (x > maxX) {
			    x = maxX;
			    exit = true;
			}
			
			y1 = getLineYatX(l1, x);
			y2 = getLineYatX(l2, x);
			d  = Math.abs(y2 - y1);
			if ( d <= distance ) {
				distance = d;
				p1.x = x;
				p1.y = y1;
				p2.x = x;
				p2.y = y2;
			}
			points.push([x, y1], [x, y2]);
			
			if (exit) {
			    break;
			}
		}
		
		return { 
			distance : distance, 
			p1       : p1, 
			p2       : p2, 
			points   : points 
		};
	}
}

function sumLinesY(l1, l2, method, precision)
{
	precision = Math.abs( GC.Util.round( precision, 50 ) );
	
	var len1 = l1.length,
		len2 = l2.length,
		out  = [];
	
	if ( len1 > 1 && len2 > 1 ) {
		
		var range1   = findMinMax(l1, 0),
			range2   = findMinMax(l2, 0),
			minX     = Math.min(range1.min, range2.min),
			maxX     = Math.max(range1.max, range2.max),
			range    = maxX - minX,
			step     = range / (precision + 1),
			x;
			
		for ( x = minX; x < maxX; x = Math.min(x + step, maxX) ) {
			
			if ( x < Math.max(range1.min, range2.min) ) {
				out.push([ 
					x, 
					l1[0][0] < l2[0][0] ? getLineYatX(l1, x) : getLineYatX(l2, x)
				]);
			}
			else if ( x > Math.min( range1.max, range2.max ) ) {
				out.push([ 
					x, 
					range1.max > range2.max ? getLineYatX(l1, x) : getLineYatX(l2, x)
				]);
			}
			else {
				out.push([ x, Math[method](getLineYatX(l1, x), getLineYatX(l2, x)) ]);
			}	
		}
	}
	
	return out;
}

function lineToCurve( line ) {
	var len = line.length;
	
	if ( len < 3 ) {
		return line;
	}
	
	var out = ["M" + line[0][0] + "," + line[0][1]],
		pointBefore,
		pointAfter,
		i;
	
	for ( i = 1; i < len - 1; i++ ) {
		pointBefore = line[ i - 1 ];
		pointAfter  = line[ i + 1 ];
		
		out.push("S" + pointBefore.join(",") + "," + pointAfter.join(","));
	}
	
	return out;
}

function months2weeks( m ) 
{
	return GC.Util.floatVal( m ) * GC.Constants.TIME_INTERVAL.DAYS_IN_MONTH / GC.Constants.TIME_INTERVAL.DAYS_IN_WEEK;
}

function weeks2months( w )
{
	return GC.Util.floatVal( w ) * GC.Constants.TIME_INTERVAL.DAYS_IN_WEEK / GC.Constants.TIME_INTERVAL.DAYS_IN_MONTH;
}
	
function concatLMSDataSources( src1, src2 ) {
	var name = src1 + "_+_" + src2;
	if ( !GC.DATA_SETS.hasOwnProperty(name) ) {
		var data1 = GC.DATA_SETS[src1].data,
			data2 = GC.DATA_SETS[src2].data,
			l1, l2, last, i, gender = null, out = $.extend({}, GC.DATA_SETS[src1]);
		
		for ( gender in data1 ) {
			if ( gender in data2 ) {
				l1 = data1[gender].length;
				l2 = data2[gender].length;
				last = data1[gender][l1 - 1];
				for ( i = 0; i < l2; i++ ) {
					if ( data2[gender][i].Agemos > last.Agemos ) {
						out.data[gender].push($.extend({}, data2[gender][i]));
					}
				}
			}
		}
		GC.DATA_SETS[name] = out;
	}
	return name;
}

function concatPointsDataSources( src1, src2 ) {
	var name = src1 + "_+_" + src2;
	if ( !GC.DATA_SETS.hasOwnProperty(name) ) {
		var data1 = GC.DATA_SETS[src1].data,
			data2 = GC.DATA_SETS[src2].data,
			l1, l2, last, i, gender = null, out = $.extend({}, GC.DATA_SETS[src1]);
		
		for ( gender in data1 ) {
			for ( var label in data1[gender] ) {
				l1 = data1[gender][label].length;
				l2 = data2[gender][label].length;
				last = data1[gender][label][l1 - 1];
				for ( i = 0; i < l2; i++ ) {
					if ( data2[gender][label][i].Agemos > last.Agemos ) {
						out.data[gender][label].push($.extend({}, data2[gender][label][i]));
					}
				}
			}
		}
		GC.DATA_SETS[name] = out;
	}
	return name;
}
	
function findMinMax(arr, el) 
{
	var len = arr.length;
	if (!len) {
		return { min: 0, max : 0 };
	}
	var res = { min: arr[0][el], max: arr[0][el] };
	
	if (len > 1) {
		for ( var i = len - 1; i >= 0; i-- ) {
			if (arr[i][el] < res.min) res.min = arr[i][el];
			if (arr[i][el] > res.max) res.max = arr[i][el];
		}
	}
	return res;
}

function getYatX( x, p1x, p1y, p2x, p2y ) 
{
	if (p1y === p2y) return p1y;
	if (p1x === p2x) return (p1y + p2y) / 2;
	var a = p1y - p2y, b = p2x - p1x;
	return p1y - a * (x - p1x)/b;
}

function getXatY( y, p1x, p1y, p2x, p2y ) 
{
	// x = x0 + (1 / slope) * (y - y0)
	//var x = p1x + (1 / (p2x - p1x)) * (y - p1y);
	var x = p1x + (p2x - p1x) * (y - p1y) / (p2y - p1y);
	return x;
	
	if (p1x === p2x) return p1x;
	if (p1y === p2y) return (p1x + p2x) / 2;
	var a = p1y - p2y, b = p2y - p1y;
	return p1x - b * (y - p1y)/b;
}

/**
 * The data returned by getCurvesData() usually contains extra entries 
 * for each line. It has the last point before the current start age (if
 * the start age is greather then 0) and the first point after the end 
 * age (if such point exists). Now that data must be "cropped to the 
 * chart dimensions"
 */
function cropCurvesDataX( data, minX, maxX ) 
{
	
	var len = data.length, i, ps;
	if ( len > 1 ) {
		for ( i = 0; i < len; i++ ) {
			ps = new PointSet( data[i].data, "x", "y" );
			ps.limitDensity(80);
			ps.clip(minX, maxX);
			//ps.smooth(3);
			
			data[i].data = ps._data;
			ps = null;
		}
	}
	return data;
}

/**
 * Same as cropCurvesDataX() but crops the patient pints data which is single 
 * line (one level array), the "x" property is called "agemos" and the "y" 
 * property is called "value".
 */
function cropPatientDataX( data, minX, maxX, minY, maxY )
{
	var l = data.length, i, point, 
		croppedBefore, 
		croppedAfter, 
		croppedAbove, 
		croppedBelow, 
		lastPoint,
		out = [];
		
	if ( l > 1 ) {
		for ( i = 0; i < l; i++ ) {
			point = $.extend({}, data[i]);
			point.overflow = data[i].value > maxY || data[i].value < minY
			
			// Crop left
			if ( point.agemos < minX && i < l - 1 ) {
				if ( !croppedBefore || croppedBefore.agemos < point.agemos ) {
					croppedBefore = {
						agemos : minX,
						value  : getYatX(minX, point.agemos, point.value, data[i+1].agemos, data[i+1].value)
					};
				}
			}
			
			// Crop right
			else if ( point.agemos > maxX && i > 0 ) {
				if ( !croppedAfter || croppedAfter.agemos > point.agemos ) {
					croppedAfter = {
						agemos : maxX,
						value  : getYatX(maxX, point.agemos, point.value, data[i-1].agemos, data[i-1].value)
					};
				}
			}
			else {
				out.push( point );
			}
			
			lastPoint = point;
		}
	}
	
	if ( croppedBefore ) {
		out.unshift( croppedBefore );
		out.croppedBefore = true;
	}
	
	if ( croppedAfter ) {
		out.push( croppedAfter );
		out.croppedAfter = true;
	}
	
	return out;
}

function scale( X, dataMin, dataMax, axisMin, axisMax ) 
{
	if ( dataMin === dataMax ) {
		return axisMin + ( axisMax - axisMin ) / 2;
	}
	
	var a = ( axisMax - axisMin ) / ( dataMax - dataMin );
	var b = axisMin - a * dataMin;
	
	return a*X + b;
};

function getCurvesData( dataSet, startAge, endAge )
{
	if ( !GC.DATA_SETS.hasOwnProperty(dataSet) ) {
		//throw "No such data-set '" + dataSet + "'";
		return [];
	}
	
	var gender   = GC.App.getGender(),
		data     = [],
		set      = GC.DATA_SETS[dataSet],
		pcts     = GC.Preferences.prop("percentiles");
		
	if ( startAge === undefined ) {
		startAge = Math.max(GC.App.getStartAgeMos() - 1, 0);
	}
	
	if ( endAge === undefined ) {
		endAge = GC.App.getEndAgeMos() + 1;
	}
	//console.log(startAge, " - ", endAge);
	
	if (set.type == "LMS") { 
		$.each(pcts, function(i, pct) {
			data[i] = {
				label: pct * 100 , 
				data : GC.generateCurveSeries(set, gender, pct, startAge, endAge)
			};
		});
	} 
	else if (set.type == "points") {
		var sets = set.data[gender];
		
		for (var label in sets) {
			data.push({ 
				label: label, 
				data: GC.convertPointsSet (sets[label], startAge, endAge) 
			});
		}
		
		data.sort(function (a,b) {
			if ( a.data && a.data.length && b.data && b.data.length )
				return a.data[0].y - b.data[0].y;
			return 0;
		});
	}
	
	return data;
}

function formatWeeks( weeks )
{
	if ( weeks < 0 )
		return "-";
		
	if ( weeks < 1 )
		return GC.Util.round( weeks * 7 ) + "d";
		
	if ( weeks > GC.Constants.TIME_INTERVAL.WEEKS_IN_YEAR )
		return GC.Util.round( (weeks / GC.Constants.TIME_INTERVAL.WEEKS_IN_YEAR) * 10 ) / 10 + "Y";
		
	//if ( weeks > GC.Constants.TIME_INTERVAL.WEEKS_IN_MONTH )
	//	return GC.Util.round( weeks / GC.Constants.TIME_INTERVAL.WEEKS_IN_MONTH ) + "m";
	
	return weeks;
}

function formatMonths( m )
{
	if ( m < 0 )
		return "-";
		
	if ( m > 12 )
		return GC.Util.round( (m / 12) * 10 ) / 10 + "Y";
	
	return m;
}

function strPad( str, len, character, front ) {
	var l = str.length, add = "", i; 
	if (len > l) {
		for ( i = l; i < len; i++ ) {
			add += character || " ";
		}
		if (front) {
			str = add + str;
		} else {
			str += add;
		}
	}
	return str;
}

function stripTags(str) {
	return str.replace(/<.*?>/g, "");
}

function ellipsis(str, maxWords, maxChars, suffix) {
	str    = $.trim(stripTags(String(str)));
	suffix = String(suffix || "...");
	
	var words = str.split(/\s+/),
		l = words.length,
		out = [],
		outLen = 0,
		word,
		i;
	
	for ( i = 0; i < l && i < maxWords; i++ ) {
		out[i] = words[i];
	}
	
	out = out.join(" ");
	outLen = out.length;
	
	if (maxChars && outLen > maxChars - suffix.length) {
		out = out.substr(0, maxChars - suffix.length) + suffix;
	}
	
	return out;
}

// Tooltip
(function() {
	
	var _tooltips = [];
	
	/*   P1  __________________  P2
	 *      /                  |
	 *     /                   |
	 * P0 <       Tooltip      |
	 *     \                   |
	 *      \__________________| 
	 *   P4                     P3
	 */
	
	/**
	 * The Tooltip class
	 * @constructor
	 */
	function Tooltip( paper, cfg )
	{
		this.id     = cfg.id;
		this.cfg    = cfg;
		this.nodes  = [];
		this.paper  = paper;
		this.p0     = new GC.Point();
		this.p1     = new GC.Point();
		this.p2     = new GC.Point();
		this.p3     = new GC.Point();
		this.p4     = new GC.Point();
		this.shiftY = 0//cfg.shiftY;
		this.orient = GC.Constants.DIRECTION.RIGHT;
		
		this.shadow = paper.path().attr({
			fill    : cfg.shadowColor,
			blur    : cfg.shadowBlur,
			opacity : cfg.shadowOpacity
		}).addClass("tooltip-node");
		
		if ( !Raphael.svg ) {
			this.shadow.hide();
		}
		
		this.shape = paper.path().attr({
			fill : cfg.bg,
			stroke : "none"
		}).addClass("tooltip-node");
		
		this.contentSet = cfg.contentSet || paper.set();
		
		this.txt = paper.set();
		
		this.txt1 = paper.text(0, 0, cfg.text).attr({
			"text-anchor" : "start",
			"fill" : cfg.color
		}).attr(this.cfg.textAttr).addClass("tooltip-node");
		
		this.txt.push(this.txt1);
		
		this.triangle = paper.path().attr({
			fill   : GC.Util.darken(cfg.bg, 0.80),
			stroke : "none"
		}).addClass("tooltip-node");
		
		//this.box = paper.rect(0, 0, 0, 0).attr({
		//	stroke : "red",
		//	"stroke-width" : 0.5,
		//	fill : "#000",
		//	"fill-opacity" : 0
		//});
		
		this.nodes.push( this.shadow, this.shape, this.triangle, this.txt/*, this.box*/ );
		
		if (cfg.text2) {
			if (cfg.text2bg) {
				this.text2bg = paper.rect(0, 0).attr({
					"fill" : cfg.text2bg,
					"stroke" : "none"
				}).addClass("tooltip-node");
				this.txt.push(this.text2bg);
			}
			this.text2 = paper.text(0, 0, cfg.text2).attr({
				"text-anchor" : "end",
				"fill" : cfg.color
			}).attr(this.cfg.textAttr).addClass("tooltip-node");
			this.txt.push(this.text2);
		}
		
		this.textBox = this.txt.getBBox();
		
		this.setOrientation(GC.Constants.DIRECTION.RIGHT);
		
		var width = this.p2.x;
		if (this.cfg.getWidth) {
			width = this.cfg.getWidth(this, width);
		}
		if ( width > paper.width ) {
			this.setOrientation(GC.Constants.DIRECTION.LEFT);
		}
		
		_tooltips.push(this);
		
		Tooltip.reorder();
	}
	
	Tooltip.reorder = function()
	{ 
		var l = _tooltips.length,
			thisTooltip,
			tt, 
			i,
			j,
			thisBox,
			curBox,
			shift,
			prevY;
		
		for ( i = 0; i < l; i++ ) {
			thisTooltip = _tooltips[i];
			shift = thisTooltip.cfg.shiftY;
			prevY = null;
			
			if (thisTooltip.shiftY !== shift) {
				thisTooltip.setShiftY( shift );
			}
			
			//if ( i === 0 ) {
				
			//} else {
				thisBox = thisTooltip.getBBox();
				for ( j = 0; j < l; j++ ) {
					tt = _tooltips[j];
					curBox = tt.getBBox();				
					if (
						// Don't compare with itself
						//j !== i
						tt !== thisTooltip
						
						// The observed point is above
						&& (tt.cfg.y < thisTooltip.cfg.y || (tt.cfg.y === thisTooltip.cfg.y && tt.cfg.x >= thisTooltip.cfg.x))
						
						// If this is the first point above, or if the previous 
						// one was higher than this one
						&& (prevY === null || prevY <= tt.cfg.y)
						
						// If the tooltips intersect
						&& !(thisBox.x2 < curBox.x1 || thisBox.x1 > curBox.x2)
						&& !(thisBox.y2 < curBox.y1 || thisBox.y1 > curBox.y2)
						
						// Skip the hidden tooltips
						&& (tt.nodes[0] && tt.nodes[0].node.style.display != "none")
					) {
						prevY = tt.cfg.y;
						shift = curBox.y2 + 10 - (thisTooltip.cfg.y - (thisTooltip.p3.y - thisTooltip.p2.y) / 2);
					}
				}
			//}
			
			if (prevY !== null && thisTooltip.shiftY !== shift) {
				thisTooltip.setShiftY( shift );
			}
		}
	};
	
	Tooltip.removeAll = function()
	{
		var l = _tooltips.length;
		while ( l-- ) {
			_tooltips.pop().remove();
		}
	};
	
	Tooltip.prototype = {
		
		getBBox : function() {
			var box = {
				x1 : Math.min(this.p0.x, this.p1.x, this.p2.x, this.p3.x, this.p4.x),
				x2 : Math.max(this.p0.x, this.p1.x, this.p2.x, this.p3.x, this.p4.x),
				y1 : Math.min(this.p0.y, this.p1.y, this.p2.y, this.p3.y, this.p4.y),
				y2 : Math.max(this.p0.y, this.p1.y, this.p2.y, this.p3.y, this.p4.y)
			},
			shadowBox = this.shadow.getBBox();
			
			box.x1 = Math.min(box.x1, shadowBox.x );
			box.x2 = Math.max(box.x2, shadowBox.x2);
			box.y1 = Math.min(box.y1, shadowBox.y );
			box.y2 = Math.max(box.y2, shadowBox.y2);
			
			box.width  = box.x2 - box.x1;
			box.height = box.y2 - box.y1;
			return box;
		},
		
		remove : function() 
		{
			while ( this.nodes.length ) {
				this.nodes.shift().remove();
			}
			for ( var i = _tooltips.length - 1; i >= 0; i--) {
				if ( _tooltips[i].id === this.cfg.id ) {
					_tooltips.splice(i, 1);
					break;
				}
			}
		},
		
		setShiftY : function( val ) 
		{
			var top = this.p0.y + val - this.cfg.paddingY - this.textBox.height / 2;
			if ( top < 40 ) {
				val += Math.abs(40 - top);
			}
			
			this.shiftY = val;
			this.p1.y = this.p0.y + this.shiftY - this.cfg.paddingY - this.textBox.height / 2;
			this.p2.y = this.p1.y;
			this.p3.y = this.p0.y + this.shiftY + this.cfg.paddingY + this.textBox.height / 2;
			this.p4.y = this.p3.y;
			this.draw();
		},
		
		setOrientation : function( orient ) 
		{
			this.p0.y = this.cfg.y;
			this.p1.y = this.cfg.y + this.shiftY - this.cfg.paddingY - this.textBox.height / 2;
			this.p2.y = this.p1.y;
			this.p3.y = this.cfg.y + this.shiftY + this.cfg.paddingY + this.textBox.height / 2;
			this.p4.y = this.p3.y;
			
			var width = this.textBox.width;
			
			switch ( orient ) {
				case GC.Constants.DIRECTION.LEFT:
					this.p0.x = this.cfg.x - this.cfg.pointOffset;
					this.p1.x = this.p0.x  - this.cfg.offsetX;
					this.p2.x = this.p1.x  - width - this.cfg.paddingX * (this.text2 ? 4 : 2);
					this.p3.x = this.p2.x;
					this.p4.x = this.p1.x;
					this.orient = GC.Constants.DIRECTION.LEFT;
					break;
				case GC.Constants.DIRECTION.RIGHT:
				default:
					this.p0.x = this.cfg.x + this.cfg.pointOffset;
					this.p1.x = this.p0.x  + this.cfg.offsetX;
					this.p2.x = this.p1.x  + width + this.cfg.paddingX * (this.text2 ? 4 : 2);
					this.p3.x = this.p2.x;
					this.p4.x = this.p1.x;
					this.orient = GC.Constants.DIRECTION.RIGHT;
					break;
			}
			
			this.draw();
		},
		
		draw : function()
		{
			var a = Raphael.angle(
				this.cfg.x + 1,
				this.cfg.y,
				this.cfg.x,
				this.cfg.y,
				this.p1 .x,
				this.p1 .y + (this.p4.y - this.p1.y) / 2
			);
			
			this.p0.y = this.cfg.y + this.cfg.pointOffset * Math.sin( a );
			
			this.shape.attr(
				"path", 
				"M" + this.p0.x + "," + this.p0.y +
				"L" + this.p1.x + "," + this.p1.y + 
				"L" + this.p2.x + "," + this.p2.y +
				"L" + this.p3.x + "," + this.p3.y +
				"L" + this.p4.x + "," + this.p4.y +
				"Z"
			);
			
			
			
			this.txt.attr({
				x : this.orient == GC.Constants.DIRECTION.RIGHT ? 
					this.p1.x + this.cfg.paddingX :
					this.p1.x - this.cfg.paddingX,
				y : this.p1.y + this.cfg.paddingY + this.textBox.height / 2,
				"text-anchor" : this.orient == GC.Constants.DIRECTION.RIGHT ? "start" : "end"
			}).attr(this.cfg.textAttr);
			
			if (this.text2) {
				var textBox2 = this.text2.getBBox();
				this.text2.attr({
					x : this.orient == GC.Constants.DIRECTION.RIGHT ? 
						this.p1.x + this.cfg.paddingX * 3 + this.textBox.width - textBox2.width :
						this.p2.x + this.cfg.paddingX + textBox2.width,
					y : this.p1.y + this.cfg.paddingY + this.textBox.height / 2,
					"text-anchor" : this.orient == GC.Constants.DIRECTION.RIGHT ? "start" : "end"
				});
				if (this.text2bg) {
					this.text2bg.attr({
						x : this.orient == GC.Constants.DIRECTION.RIGHT ? 
							this.p1.x + this.cfg.paddingX * 2 + this.textBox.width - textBox2.width :
							this.p2.x,
						y : this.p1.y,
						width : textBox2.width + this.cfg.paddingX * 2,
						height: this.p4.y - this.p1.y
					})
				}
			}
			
			this.triangle.attr(
				"path", 
				"M" + this.p0.x + "," + this.p0.y +
				"L" + this.p1.x + "," + this.p1.y + 
				"L" + this.p4.x + "," + this.p4.y +
				"Z"
			);
			
			this.shadow.attr(
				"path", 
				"M" +  this.p0.x + "," + this.p0.y +
				"L" +  this.p1.x + "," + (this.p1.y + this.cfg.shadowOffsetY) +
				"L" + (this.p2.x + this.cfg.shadowOffsetX * (this.orient === GC.Constants.DIRECTION.RIGHT ? 1 : -1)) + "," + (this.p2.y + this.cfg.shadowOffsetY) +
				"L" + (this.p3.x + this.cfg.shadowOffsetX * (this.orient === GC.Constants.DIRECTION.RIGHT ? 1 : -1)) + "," + (this.p3.y + this.cfg.shadowOffsetY) +
				"L" +  this.p4.x + "," + (this.p4.y + this.cfg.shadowOffsetY) +
				"Z"
			);
			
			if (this.cfg.onCreate) {
				this.cfg.onCreate(this);
			}
			
			//var box = this.getBBox();
			//this.box.attr({
			//	x : box.x1,
			//	y : box.y1,
			//	width : box.width,
			//	height : box.height
			//});
		}
	};
	
	$.each(["show", "hide", "toFront", "toBack"], function(i, method) {
		Tooltip.prototype[ method ] = function() {
			$.each(this.nodes, function(j, o) {
				o[method]();
			});
			Tooltip.reorder();
			return this;
		};
	});
	
	function tooltip( paper, settings ) {
		
		if (paper == "removeAll") {
			Tooltip.removeAll();
			return;
		}
		
		var cfg = $.extend(true, {
			text          : "Empty tooltip",
			x             : 100,
			y             : 100,
			bg            : "#6A7D8F",
			color         : "#FFF",
			paddingX      : 10,
			paddingY      : 5,
			offsetX       : 19,
			pointOffset   : 0,
			shiftY        : 0,
			minWidth      : 30,
			shadowOffsetX : 3,
			shadowOffsetY : 3,
			shadowOpacity : 0.4,
			shadowColor   : "#000",
			shadowBlur    : 2,
			text2         : "",
			textAttr      : {
				"font-size" : 14
			},
			id            : Raphael.createUUID()
		}, settings);
		
		for ( var i = _tooltips.length - 1; i >= 0; i--) {
			if ( _tooltips[i].id === cfg.id ) {
				_tooltips[i].remove();
				_tooltips.splice(i, 1);
				break;
			}
		}
		
		return new Tooltip( paper, cfg );
	}
	
	GC.Tooltip = Tooltip;
	GC.tooltip = tooltip;
	
})();


// =============================================================================
// Raphael and Jquery plugins that are just temporary here!
// =============================================================================

// $.fn.equalHeight
(function($) {
	
	$.fn.equalHeight = function() {
		var h = 0;
		return this.each(function() {
			h = Math.max(h, $(this).height());
		}).height(h);
	};
	
})( jQuery );


// Raphael plugins
(function() {
	
	
	Raphael.el.addClass = function( name ) {
		if ( this.node.classList ) {
			this.node.classList.add( name );
		} else {
			var c = this.node.getAttribute("class") || "";
			if ( !c ) {
				this.node.setAttribute("class", name);
			}
			else if ( c.indexOf( name ) == -1 ) { 
				this.node.setAttribute("class", c + " " + name);
			}
		}
		return this;
	};
	
	
	Raphael.el.removeClass = function( name ) {
		if ( this.node.classList ) {
			this.node.classList.remove( name );
		} else {
			var c = this.node.getAttribute("class") || "";
			if ( c.indexOf( name ) > -1 ) { 
				this.node.setAttribute(
					"class", 
					c.replace(new RegExp("\\s?\\b" + name + "\\b", "g"), "")
				);
			}
		}
		return this;
	};
	
	Raphael.el.toggleClass = function( name, flag ) {
		if ( flag !== undefined ) {
			return this[!!flag ? "addClass" : "removeClass"]( name );
		}
		
		if ( this.node.classList ) {
			this.node.classList.toggle( name );
		} else {
			var c = this.node.getAttribute("class") || "";
			return this[c.indexOf( name ) == -1 ? "addClass" : "removeClass"]( name );
		}
		return this;
	};
	
})();

// $.fn.scrollParent
(function($) {
	
	$.fn.scrollParent = function() {
		var node = this[0], css;
		while (node && node.parentNode) {
			node = node.parentNode;
			
			css = $(node).css("overflow");
			if ( css != "visible" ) return $(node);
			
			css = $(node).css("overflowX");
			if ( css != "visible" ) return $(node);
			
			css = $(node).css("overflowY");
			if ( css != "visible" ) return $(node);
		}
		
		return null;
	};
	
})(jQuery);

// $.helperStyle
// =============================================================================
(function($) {
	
	var _helperStyle;
	
	function getCssHelperStyle() {
		if ( !_helperStyle ) {
			_helperStyle = $('<style type="text/css"/>').appendTo('head');
		}
		_helperStyle[0].disabled = false;
		return _helperStyle[0][$.browser.msie ? 'styleSheet' : 'sheet'];
	}
	
	$.helperStyle = function( selector, style ) {
		var s = getCssHelperStyle(), 
			rules = s[$.browser.msie ? 'rules' : 'cssRules'],
			handled = false;
		$.each(rules, function(i, rule) {
			if ( rule.selectorText.toLowerCase() == selector.toLowerCase() ) {
				$.extend(rule.style, style);
				handled = true;
			}
		});
		//console.dir(s);
		if (!handled) {
			if ( s.insertRule ) { // W3C
				s.insertRule( selector + " {}", rules.length );
			}
			else if ( s.addRule ) { // MS
				s.addRule( selector, "color: transparent" );
			}
			$.extend(rules[rules.length - 1].style, style);
		}
	};
	
})(jQuery);

// mask / unmask
// =============================================================================
(function($) {
	
	$.fn.mask = function(options) {
		var cfg = $.extend({
			bgcolor : "#DDD",
			opacity : 0.5,
			z       : 100,
			html    : ""
		}, options);
		
		return this.each(function() {
			var $elem  = $(this),
				mask   = $elem.data("mask"),
				offset = $elem.offset();
			
			if (!mask) {
				mask = $('<div/>').css({
					position : "absolute",
					opacity  : 0
				}).appendTo("body");
				$elem.data("mask", mask);
			}
			
			mask.css({
				opacity: 0.01,
				top : offset.top,
				left: offset.left,
				width: $elem.outerWidth(),
				height: $elem.outerHeight(),
				lineHeight: $elem.outerHeight() + "px",
				textAlign : "center",
				zIndex : cfg.z,
				color: GC.Util.readableColor(cfg.bgcolor),
				backgroundColor: cfg.bgcolor,
				fontWeight: "bold",
				overflow : "hidden"
			}).html(cfg.html).stop(1, 0).animate({ opacity: cfg.opacity }, {
				duration: 400,
				queue : false
			});
		});
	};
	
	$.fn.unmask = function(duration) {
		return this.each(function() {
			var $elem = $(this),
				mask  = $elem.data("mask");
			if (mask) {
				mask.animate({ opacity: 0 }, GC.Util.intVal(duration, 400), "swing", function() {
					$(this).remove();
					$elem.removeData("mask");
				});
			}
		});
	};
	
})(jQuery);

// toggle-button
// =============================================================================
(function($) {
	function updateToggleButtons(name, value) {
		$(".toggle-button-wrap input[name='" + name + "']").each(function(i, input) {
			$(this).closest(".toggle-button-wrap").find("label").each(function() {
				$(this).toggleClass("active", this.getAttribute("data-value") === value);
				input.value = value;
			});
		});
	}
	
	$(function() {
		$("input.toggle-button").each(function(i, input) {
			var $input = $(input),
				v1 = $input.attr("data-value1"),
				v2 = $input.attr("data-value2"),
				l1 = $input.attr("data-label1"),
				l2 = $input.attr("data-label2"),
				c  = $input.attr("data-classnames");
			
			if ( v1 && v2 && l1 && l2 ) {
				$input.removeClass("toggle-button").wrap('<span class="toggle-button-wrap"/>');
				var $wrapper = $input.parent();
				$wrapper.append(
					'<table class="toggle-button">\
						<tr>\
							<td><label data-value="' + v1 + '">' + l1 + '</label></td>\
							<td class="action">\
								<div>\
									<label data-value="' + v1 + '"></label>\
									<label data-value="' + v2 + '"></label>\
								</div>\
							</td>\
							<td><label data-value="' + v2 + '">' + l2 + '</label></td>\
						</tr>\
					</table>'
				);
				
				if (c) {
					$wrapper.addClass(c);
				}
				
				$input.change(function() {
					updateToggleButtons(this.name, this.value);
				});
				
				$wrapper.on("click", "label", function() {
					if ($(this).closest(".toggle-button-wrap").is(".disabled")) {
						return true;
					}
					var val = this.getAttribute("data-value");
					if (val !== input.value) {
						input.value = val;
						$input.trigger("change");
					}
				});
				
				updateToggleButtons(input.name, input.value);
			}
		});
	});
})(jQuery);

// checkbox-button
// =============================================================================
(function($) {
	
	$(function() {
		$("input.checkbox-button").each(function(i, input) {
			var $input = $(input),
				l  = $input.attr("data-label")
				c1 = $input.attr("data-classnames"),
				c2 = $input.attr("data-btnclassnames") || "";
			
			$input.removeClass("checkbox-button").wrap('<label class="checkbox-button"/>');
			var $wrapper = $input.parent();
			
			// label
			if (l) {
				$wrapper.append($('<span/>').text(l));
			}
			
			// button
			$wrapper.append(
				$('<div class="btn-wrap"><div class="btn"/></div>').addClass(c2)
			);
			
			$wrapper.on("click", function(e) {
				if ($(this).is(".disabled")) {
					e.preventDefault();
					return true;
				}
			});
		});
	});
	
})(jQuery);

// menu-button
// =============================================================================
(function($) {
	
	$.widget("GC.menuButton", {
		
		options : {
			dataSet : [],
			placeHolder : ""
		},
		
		// Selected value
		_value : "",
		
		// Selected index
		_index : -1,
		
		_createList : function() {
			var menu = this.element.find( ".menu" ).empty(),
				inst = this,
				idx  = 0;
			
			$.each( this.options.dataSet, function( i, option ) {
				if ( option == "-" || option == "separator" ) {
					$('<div class="separator"/>').appendTo(menu);
				} else {
					option.index = idx++;
					
					var div = $('<div class="option" data-index="' + option.index + '" />')
						.data("option", option)
						.html( '<a>' + option.label + '</a>' )
						.appendTo(menu);
					
					if ( option.disabled )
						div.addClass("ui-state-disabled");
						
					if ( option.selected )
						inst._index = option.index;
				}
			});
			
			if ( this._index > -1 ) {
				this.index( this._index, true );
			} else {
				this.element.find(".value > span").html(this.options.placeHolder);
			}
		},
		
		_create : function() {
		
			this.element.addClass("menu-button").disableSelection().html(
				'<div class="value"><span/></div><div class="btn"/><div class="menu"></div>'
			);
		
			this._on("body", { 
				"mousedown": function() {
					this.element.removeClass("expanded").find( ".menu" ).hide();
				}
			});
			
			this._on({
				"click" : function(e) {
					this.element.addClass("expanded").find( ".menu" ).show();
					return false;
				},
				"mousedown .btn" : function(e) {
					e.stopPropagation();
				},
				"click .btn" : function(e) {
					if ( this.element.is(".expanded") ) {
						this.element.removeClass("expanded").find( ".menu" ).hide();
						return false;
					}
				},
				"mousedown .option" : function(e) {
					var div = $(e.target).closest(".option");
					if (div.is(".ui-state-disabled"))
						return false;
						
					this.value( div.data("option").value );
				}
			});
			
			this._createList();
		},
		
		_deselectAll : function() {
			$.each( this.options.dataSet, function( i, option ) {
				option.selected = false;
			});
			
			this._index = -1;
			this._value = undefined;
			this.element.find(".value > span").html(this.options.placeHolder);
			this.element.find(".menu > div").removeClass("selected");
			return this;
		},
		
		value : function( val, silent ) {
			if ( val === undefined ) 
				return this._value;
			
			if ( this._value !== val ) {
				
				var inst = this, j = 0;
				
				this._deselectAll();
				
				$.each( this.options.dataSet, function( i, option ) {
					
					if ( option == "-" || option == "separator" ) {
						return true;
					}
					
					if ( option.value === val ) {
						inst.element.find(".value > span").text( option.label );
						inst._value = val;
						inst._index = j;
						option.selected = true;
						inst.element.find('.menu > div[data-index="' + j + '"]').addClass("selected");
						inst.element.removeClass("expanded");
						if (!silent) {
							inst._trigger("change", null, { value : val });
						}
						return false; // break
					}
					
					j++;
				});
			}
			
			return this;
		},
		
		index : function( i, silent ) {
			if ( i === undefined )
				return this._index;
				
			i = parseInt(i, 10);
			if ( !isNaN(i) && i >= -1 ) {
				
				if ( i == -1 ) {
					return this._deselectAll();
				}
				
				var j = 0, 
					inst = this;
				$.each( this.options.dataSet, function( i, option ) {
					if ( option == "-" || option == "separator" ) {
						return true;
					}
					if ( j++ === i ) {
						inst.value( option.value, silent );
						return false;
					}
				});
			}
			return this;
		}
		
	});
	
	$(function() {
		$(".menu-button").menuButton({
			placeHolder : "PICK A CHART",
			dataSet : [
				{
					label : "CDC",
					value : "CDC"
				},
				{
					label : "WHO",
					value : "WHO"
				},
				"-",
				{
					label    : "Bayer-Bayley",
					value    : "BB"
				},
				{
					label : "Down Syndrome",
					value : "DS"
				},
				{
					label : "Fenton",
					value : "FENTON"
				}
			]
		});
	});
	
})(jQuery);

// AutoComplete
// =============================================================================
(function($) {
	
	$.widget("GC.autoComplete", {
		
		options : {
			dataSet : []
		},
		
		_create : function() {
			var w = this.element.addClass("auto-complete").outerWidth();
			this.element.wrap('<span class="auto-complete-wrap"/>');
			this.wrapper = this.element.parent().width(w);
		},
		
		_setListIndex : function(i, doScroll) {
			if (this._list) {
				var l = this._list.find("> div").length;
				if (l) {
					if (i == "+=1" || i == "down") {
						this._listIndex++;
					} else if (i == "-=1" || i == "up") {
						this._listIndex--;
					} else {
						this._listIndex = GC.Util.floatVal(i);
					}
					
					if (this._listIndex >= l) {
						this._listIndex = 0;
					}
					if (this._listIndex < 0) {
						this._listIndex = l - 1;
					}
					
					this._list.find("> div.selected").removeClass("selected");
					
					var selDiv = this._list.find("> div:eq(" + this._listIndex + ")").addClass("selected");
					
					if ( doScroll ) {
						var scroll = this._list[0].scrollTop;
						var cH     = this._list[0].clientHeight;
						if (selDiv[0].offsetTop + selDiv.outerHeight() - scroll > cH) {
							selDiv[0].scrollIntoView();
						} 
						if (selDiv[0].offsetTop < scroll) {
							this._list[0].scrollTop = 0;
						}
					}
				}
			}
		},
		
		value : function(val, silent) {
			if (val === undefined) {
				return this.element.val();
			}
			
			this.element.val(val);
			if ( !silent ) {
				this._trigger("change", null, { 
					value : val ,
					text  : this.element.val()
				});
			}
			return this;
		},
		
		_onArrowDown : function(e) {
			if ( !this._list ) {
				this._showList();
			}
			else {
				this._setListIndex("down", true);
			}
		},
		
		_onArrowUp : function() {
			this._setListIndex("up", true);
		},
		
		_init : function() {
			
			this._listIndex = -1;
			
			this._on(this.element.parent(), {
				
				"mouseenter .auto-complete-list > div" : function(e) {
					this._setListIndex(
						this.wrapper.find(".auto-complete-list > div").index( $(e.target).closest("div")[0] )
					);
				},
				
				"click .auto-complete-list > b.add" : function(e) {
					var txt = prompt("Enter the new option value", "");
					if ( txt ) {
						this.options.dataSet.push(txt);
						this._showList();
						this._trigger("add", null, { newValue: txt });
					}
					return false;
				},
				
				"click .auto-complete-list > div i a.edit" : function(e) {
					var valueSpan = $(e.target).closest("div").find(".value");
					var txt = prompt("Enter option value", valueSpan.text());
					var idx;
					if ( txt || txt === "" ) {
						idx = this.options.dataSet.indexOf(valueSpan.text());
						this.options.dataSet[idx] = txt;
						this._showList();
						this._trigger("edit", null, { newValue: txt, idx : idx });
					}
					return false;
				},
				
				"click .auto-complete-list > div i a.delete" : function(e) {
					if (confirm("Do you really want to delete this option?")) {
						var valueSpan = $(e.target).closest("div").find(".value");
						var idx = this.options.dataSet.indexOf(valueSpan.text());
						this.options.dataSet.splice(idx, 1);
						this._showList();
						this._trigger("remove", null, { idx : idx });
					}
					return false;
				},
				
				"click .auto-complete-list > div" : function(e) {
					var valueSpan = $(e.target).closest("div").find(".value");
					this.value(valueSpan.text());
					this._list.hide();
				},
				
				"blur input" : function() {
					this.wrapper.find(".auto-complete-list").hide();
				},
				
				"focus input" : function() {
					this._showList();
				},
				
				"keydown > input" : function(e) {
					switch (e.keyCode) {
						case 38: // Up
							this._onArrowUp();
							return false;
						case 40: // Down
							this._onArrowDown();
							return false;
					}
				},
				
				"change > input" : function(e) {
					this._trigger("change", null, { 
						value : this.element.val(),
						text  : this.element.val()
					});
				},
				
				"keyup > input" : function(e) {
					switch (e.keyCode) {
						case 38: // Up
							return false;
						case 40: // Down
							return false;
						case 13: // Enter
							if (this._listIndex > -1) {
								this.value(
									this._list.find("div.selected .value").text()
								);
								this._list.hide();
							}
							return false;
						default:
							this._showList();
							break;
					}
				}
			});
		},
		
		_save : function() {
			var val = this.element.val();
			if (this.options.dataSet.indexOf(val) === -1) {
				this.options.dataSet.push(val);
			}
			return this;
		},
		
		_showList : function() {
			if (!this._list) {
				this._list = $('<div class="auto-complete-list"/>');
				this._list.appendTo(this.wrapper);
			}
			this._list.empty();
			this._listIndex = -1;
			
			var inst = this, 
				list = [], 
				val  = this.element.val();
			
			if ( val ) {
				$.each(this.options.dataSet, function(i, o) {
					if (o.toLowerCase().indexOf(val.toLowerCase()) > -1) {
						list.push(o);
					}
				});
			} else {
				list = this.options.dataSet.slice();
			}
			
			$('<b class="add">Add new option</b>').appendTo(this._list);
			
			if (list.length) {
				
				if ( val ) {
					list.sort(function(a, b) {
						return  a.toLowerCase().indexOf(val.toLowerCase()) - 
								b.toLowerCase().indexOf(val.toLowerCase());
					});
				}
				
				$.each(list, function(i, o) {
					var start = o.toLowerCase().indexOf(val.toLowerCase());
					var end   = start + val.length;
					var html  = [];
					var j     = 0;
					
					html[j++] = '<div><span class="value">';
					html[j++] = o.substr(0, start);
					if ( val ) {
						html[j++] = '<span class="highlight">';
						html[j++] = o.substring(start, end);
						html[j++] = '</span>';
					}
					html[j++] = o.substr(end);
					html[j++] = '</span>';
					html[j++] = '<i>'
					html[j++] = '<a class="delete">Delete</a>'
					html[j++] = ' | ';
					html[j++] = '<a class="edit">Edit</a>'
					html[j++] = '</i>'
					html[j++] = '</div>';
					
					$(html.join("")).appendTo(inst._list);
				});
				
				this._list.show().css("maxWidth", this._list);
				
				var sp = this._list.scrollParent();
				if (sp) {
					this._list.css("maxWidth", (sp.offset().left + sp[0].clientWidth) - this._list.offset().left - 5);
				}
				
			}
		}
		
	});

})(jQuery);

// stepInput
// =============================================================================
(function($) {
	
	$.widget("GC.stepInput", {
		
		options : {
			min       : -Infinity,
			max       : Infinity,
			value     : null,
			delay     : 200,
			speed     : 60,
			step      : 1,
			precision : 0,
			showZero  : true
		},
		
		_timer : null,
		
		_value : 0,
		
		_create : function() {
			this.element
			.addClass("step-input")
			.attr("spellcheck", "false")
			.wrap('<span class="step-input-wrap"/>');
			
			var wrapper = this.element.parent();
			
			wrapper.css({
				marginTop    : this.element.css("marginTop"   ),
				marginRight  : this.element.css("marginRight" ),
				marginBottom : this.element.css("marginBottom"),
				marginLeft   : this.element.css("marginLeft"  )
			});
			this.element.css("margin", 0);
			
			this.btnUp   = $('<b class="up" title="Increase"/>'  ).appendTo(wrapper);
			this.btnDown = $('<b class="down" title="Decrease"/>').appendTo(wrapper);
			
			if ( this.options.value || this.options.value === 0 ) {
				this.value(this.options.value);
			}
		},
		
		_init : function() {
			
			var mw = $.browser.mozilla ? "DOMMouseScroll" : "mousewheel";
			mw += ".stepinput";
			
			this._on(this.element.parent(), {
				"mousedown .up" : function() {
					this.element.trigger("focus");
					this._start(1);
				},
				"mouseup" : function() {
					this._stop();
				},
				"mouseout .up" : function() {
					this._stop();
				},
				"mousedown .down" : function() {
					this.element.trigger("focus");
					this._start(-1);
				},
				"mouseout .down" : function() {
					this._stop();
				},
				"keydown > input" : function(e) {
					switch (e.keyCode) {
						case 38: // Up
							this._step(1);
						return false;
						case 40: // Down
							this._step(-1);
						return false;
					}
				},
				"keyup > input" : function(e) {
					var start = e.target.selectionStart,
						end   = e.target.selectionEnd;
					this.value(this._parse(e.target.value));
					e.target.selectionStart = start;
					e.target.selectionEnd = end;
				},
				"focusin > input" : function() {
					var inst = this;
					$(window).unbind(mw).bind(mw, function(e) {
						var q = $.browser.mozilla 
						? e.originalEvent.detail     > 0 ? -1 : 1 
						: e.originalEvent.wheelDelta > 0 ? 1 : -1;
						inst._step(q);
						e.preventDefault();
					});
				},
				"focusout > input" : function() {
					$(window).unbind(mw);
				}
			});
		},
		
		_parse : function(str) {
			if (!str) return str;
			if ($.isFunction(this.options.parse)) {
				return this.options.parse.call(this, str);
			}
			return GC.Util.floatVal(str);
		},
		
		value : function(n, silent) {
			if (n === undefined) {
				return this._value;
			}
			
			if (n === "") {
				this.element.val("");
				if ( !silent ) {
					this._trigger("change", null, { 
						value : this._value ,
						text  : this.element.val()
					});
				}
			} else {			
				n = GC.Util.floatVal(n);
				n = Math.max(Math.min(n, this.options.max), this.options.min);
				this._value = n;
				this.element.val((this.options.format || this.format).call(this, this._value));
				this._set_value(n);
				if ( !silent ) {
					this._trigger("change", null, { 
						value : n ,
						text  : this.element.val()
					});
				}
			}
			return this;
		},
		
		_set_value : function(x) {},
		
		format : function(n) {
			return Number(n).toFixed(this.options.precision);
		},
		
		_start : function(n) {
			if (this._timer) {
				clearTimeout(this._timer);
			}
			
			this._step(n);
			
			var stepFn = (function(inst) {
				return function() {
					(inst._timer && clearTimeout(inst._timer));
					inst._step(n);
					inst._timer = setTimeout(stepFn, inst.options.speed);
				};
			})(this);
			
			this._timer = setTimeout(stepFn, this.options.delay);
		},
		
		_stop : function(type, add) {
			(this._timer && clearTimeout(this._timer));
			return this;
		},
		
		_step : function(n) {
			if ( this._canStep(n) ) {
				this.value(this._value + n * this.options.step);
			} else {
				if (n > 0) {
					this.value(Math.min(this._value + n * this.options.step, this.options.max));
				}
				else if (n < 0) {
					this.value(Math.max(this._value + n * this.options.step, this.options.min));
				}
			}
			return this;
		},
		
		_canStep : function(n) {
			return  this._value + n * this.options.step >= this.options.min && 
					this._value + n * this.options.step <= this.options.max;
		},
	});
	
	
	
})(jQuery);

// timeIntervalInput
(function($) {
	
	var META = [
		{ name: "Years"       , abbr : "y"   , q : GC.Constants.TIME.YEAR       }, 
		{ name: "Months"      , abbr : "m"   , q : GC.Constants.TIME.MONTH      }, 
		{ name: "Weeks"       , abbr : "w"   , q : GC.Constants.TIME.WEEK       }, 
		{ name: "Days"        , abbr : "d"   , q : GC.Constants.TIME.DAY        }, 
		{ name: "Hours"       , abbr : "h"   , q : GC.Constants.TIME.HOUR       }, 
		{ name: "Minutes"     , abbr : "min" , q : GC.Constants.TIME.MINUTE     }, 
		{ name: "Seconds"     , abbr : "s"   , q : GC.Constants.TIME.SECOND     }, 
		{ name: "Milliseconds", abbr : "ms"  , q : GC.Constants.TIME.MILISECOND }
	];
	
	var META_MAP = {
		"y"    : GC.Constants.TIME.YEAR, 
		"m"    : GC.Constants.TIME.MONTH, 
		"w"    : GC.Constants.TIME.WEEK, 
		"d"    : GC.Constants.TIME.DAY, 
		"h"    : GC.Constants.TIME.HOUR, 
		"min"  : GC.Constants.TIME.MINUTE, 
		"s"    : GC.Constants.TIME.SECOND, 
		"ms"   : GC.Constants.TIME.MILISECOND
	};
	
	$.widget("GC.timeIntervalInput", $.GC.stepInput, {
		
		options : {
			min      : -Infinity,
			max      :  Infinity,
			step     : GC.Constants.TIME.DAY,
			showZero : true,
			format   : null,
			showYears : true,
			showMonths : true,
			showWeeks : true,
			showDays : true,
			showHours : false,
			showMinutes : false,
			showSeconds : false,
			showMiliseconds : false
		},
		
		_timer : null,
		
		_value : 0,
		
		_create : function() {
			this._super();
			this.element.addClass("time-interval-input");
			
			if ( this.options.value || this.options.value === 0 ) {
				this.value(this.options.value);
			}
		},
		
		_set_value : function(n) {
			this.time.setMilliseconds(n);
		},
		
		_init : function() {
			this._super();
			
			this.time = new GC.Time();
			
			var inst = this;
			$.each(META, function(i, m) {
				inst["set" + m.name] = function(n) {
					return this.value(this.time["set" + m.name](n) * 1);
				};
				
				inst["add" + m.name] = function(n) {
					return this.value(this.time["add" + m.name](n) * 1);
				};
				
				inst["get" + m.name] = function() {
					return this.time["get" + m.name]();
				};
			});
		},
		
		_canStep : function(n) {
			var n = this._value + n * this.options.step,
				minStep = Number.MAX_VALUE;
				
			for ( var i = META.length - 1; i >= 0; i-- ) {
				minStep = Math.min(minStep, META[i].q);
			}
			
			return n >= this.options.min - minStep && n <= this.options.max + minStep;
		},
		
		format : function(val) {
			var str = [], 
				n = Math.abs(val), 
				inst = this,
				out;
			
			$.each(META, function(i, meta) {
				
				if ( !inst.options["show" + meta.name] ) {
					return false;
				}
				
				var floor = Math.floor( n / meta.q );
				if (floor || inst.options.showZero) {
					str.push(floor + "" + meta.abbr);
				}
				n -= floor * meta.q;
			});
			
			if (val < 0) { 
				str.unshift("-");
			}
			
			out = str.join(" ");
			
			if (this.options.postFormat) {
				out = this.options.postFormat(out);
			}
			
			return out;
		},
		
		_parse : function(str) {
			if (!str) return str;
			if ($.isFunction(this.options.parse)) {
				return this.options.parse.call(this, str);
			}
			
			var tokens = str.replace(/^\s+/, "").replace(/\s+$/, "").split(/\s+/),
				n = 0,
				l = tokens.length,
				i, v, a;
			
			for ( i = 0; i < l; i++ ) {
				v = GC.Util.floatVal(tokens[i]);
				a = tokens[i].match(/\d+(y|m|w|d|h|min|s|ms)/);
				
				if (a && a[1]) {
					n += v * META_MAP[a[1]];
				}
			}
			
			return isNaN(n) || !isFinite(n) ? 0 : n;
		}
		
	});
	
})(jQuery);


// GC.Time
// =============================================================================
GC.Time = function(ms) {
	this._milliseconds = 0;
	
	if (ms !== undefined) {
		this.setMilliseconds(ms || 0);
	}
};

GC.Time.prototype = {
	setMilliseconds : function(n) { this._milliseconds = n * GC.Constants.TIME.MILLISECOND; this.onChange(); return this; },
	setSeconds      : function(n) { this._milliseconds = n * GC.Constants.TIME.SECOND     ; this.onChange(); return this; },
	setMinutes      : function(n) { this._milliseconds = n * GC.Constants.TIME.MINUTE     ; this.onChange(); return this; },
	setHours        : function(n) { this._milliseconds = n * GC.Constants.TIME.HOUR       ; this.onChange(); return this; },
	setDays         : function(n) { this._milliseconds = n * GC.Constants.TIME.DAY        ; this.onChange(); return this; },
	setWeeks        : function(n) { this._milliseconds = n * GC.Constants.TIME.WEEK       ; this.onChange(); return this; },
	setMonths       : function(n) { this._milliseconds = n * GC.Constants.TIME.MONTH      ; this.onChange(); return this; },
	setYears        : function(n) { this._milliseconds = n * GC.Constants.TIME.YEAR       ; this.onChange(); return this; },
	
	addMilliseconds : function(n) { this._milliseconds += n * GC.Constants.TIME.MILISECOND; this.onChange(); return this; },
	addSeconds      : function(n) { this._milliseconds += n * GC.Constants.TIME.SECOND    ; this.onChange(); return this; },
	addMinutes      : function(n) { this._milliseconds += n * GC.Constants.TIME.MINUTE    ; this.onChange(); return this; },
	addHours        : function(n) { this._milliseconds += n * GC.Constants.TIME.HOUR      ; this.onChange(); return this; },
	addDays         : function(n) { this._milliseconds += n * GC.Constants.TIME.DAY       ; this.onChange(); return this; },
	addWeeks        : function(n) { this._milliseconds += n * GC.Constants.TIME.WEEK      ; this.onChange(); return this; },
	addMonths       : function(n) { this._milliseconds += n * GC.Constants.TIME.MONTH     ; this.onChange(); return this; },
	addYears        : function(n) { this._milliseconds += n * GC.Constants.TIME.YEAR      ; this.onChange(); return this; },
	
	getMilliseconds : function() { return this._milliseconds / GC.Constants.TIME.MILLISECOND; },
	getSeconds      : function() { return this._milliseconds / GC.Constants.TIME.SECOND     ; },
	getMinutes      : function() { return this._milliseconds / GC.Constants.TIME.MINUTE     ; },
	getHours        : function() { return this._milliseconds / GC.Constants.TIME.HOUR       ; },
	getDays         : function() { return this._milliseconds / GC.Constants.TIME.DAY        ; },
	getWeeks        : function() { return this._milliseconds / GC.Constants.TIME.WEEK       ; },
	getMonths       : function() { return this._milliseconds / GC.Constants.TIME.MONTH      ; },
	getYears        : function() { return this._milliseconds / GC.Constants.TIME.YEAR       ; },
	
	onChange : function() {},
	
	valueOf : function() {
		return GC.Util.floatVal(this._milliseconds);
	},
	
	toString : function(options) {
		var n   = this._milliseconds,
			
			cfg = $.extend({
				"Years"       : " " + GC.str("STR_15"), 
				"Year"        : " " + GC.str("STR_16"), 
				"Months"      : " " + GC.str("STR_17"), 
				"Month"       : " " + GC.str("STR_18"), 
				"Weeks"       : " " + GC.str("STR_19"), 
				"Week"        : " " + GC.str("STR_20"), 
				"Days"        : " " + GC.str("STR_21"),
				"Day"         : " " + GC.str("STR_22"),
				"Hours"       : false,//"hrs",
				"Hour"        : "hr",
				"Minutes"     : "min",
				"Minute"      : "min",
				"Seconds"     : "s",
				"Second"      : "s",
				"Milliseconds": "ms",
				"Millisecond" : "ms",
				separator     : ", ",
				fractions     : false,
				showZero      : false,
				limit         : 2
			}, options),
			
			META = [
				{ name: "Years"       , q : GC.Constants.TIME.YEAR }, 
				{ name: "Months"      , q : GC.Constants.TIME.MONTH }, 
				{ name: "Weeks"       , q : GC.Constants.TIME.WEEK }, 
				{ name: "Days"        , q : GC.Constants.TIME.DAY }, 
				{ name: "Hours"       , q : GC.Constants.TIME.HOUR }, 
				{ name: "Minutes"     , q : GC.Constants.TIME.MINUTE }, 
				{ name: "Seconds"     , q : GC.Constants.TIME.SECOND }, 
				{ name: "Milliseconds", q : GC.Constants.TIME.MILISECOND }
			],
			
			str = [], len;
			
		$.each(META, function(i, meta) {
			
			if ( !cfg[meta.name] && !cfg.zeroFill) {
				return false;
			}
			
			if ( cfg[meta.name] == "-" || String(cfg[meta.name]) == "false") {
				return true;
			}
			
			var floor = Math.floor( n / meta.q ),
				abbr  = cfg[floor === 1 ? meta.name.replace(/s$/i, "") : meta.name];
				
			if (floor || cfg.showZero || cfg.zeroFill) {
				len = str.push(floor + "" + abbr);
			}
			n -= floor * meta.q;
			
			if (len >= cfg.limit) {
				return false;
			}
		});
		
		return str.join(cfg.separator);
	}
};

// GC.TimeInterval extends GC.Time
// =============================================================================

GC.TimeInterval = function(d1, d2) {
	this._milliseconds = 0;
	this._startDate = new XDate();
	this._endDate = new XDate();
	
	if (d1) {
		this.setStartDate(d1);
	}
	
	if (d2) {
		this.setEndDate(d2);
	}
};

GC.TimeInterval.prototype = new GC.Time();

GC.TimeInterval.prototype.setStartDate = function( date ) {
	var d = new XDate( date );
	if (d.valid()) {
		this._startDate = d;
		this._milliseconds = d.diffMilliseconds(this._endDate);
	}
	return this;
};

GC.TimeInterval.prototype.setEndDate = function( date ) {
	var d = new XDate( date );
	if (d.valid()) {
		this._endDate = d;
		this._milliseconds = this._startDate.diffMilliseconds(d);
	}
	return this;
};

GC.TimeInterval.prototype.getStartDate = function() {
	return this._startDate;
};

GC.TimeInterval.prototype.getEndDate = function() {
	return this._endDate;
};

GC.TimeInterval.prototype.clone = function() {
	var out = new GC.TimeInterval();
	out.setStartDate( this._startDate );
	out.setEndDate( this._endDate );
	return out;
};

GC.TimeInterval.prototype.toString2 = function( options ) { 
	var interval = this.clone(), out = [], tmp;
	var cfg = $.extend({
		"Years"   : GC.str("STR_15"), 
		"Year"    : GC.str("STR_16"), 
		"Months"  : GC.str("STR_17"), 
		"Month"   : GC.str("STR_18"), 
		"Weeks"   : GC.str("STR_19"), 
		"Week"    : GC.str("STR_20"), 
		"Days"    : GC.str("STR_21"),
		"Day"     : GC.str("STR_22"),
		separator : ", ",
		fractions : false
	}, options);
	
	function fraction( n ) {
		var whole  = Math.floor( n ),
			rest   = n - whole,
			out    = String(whole || ""),
			fracts = {
				"1/2" : 1/2, 
				"1/3" : 1/3, 
				"2/3" : 2/3, 
				"1/4" : 1/4, 
				"1/4" : 3/4, 
				"1/5" : 1/5, 
				"2/5" : 2/5, 
				"3/5" : 3/5, 
				"4/5" : 4/5, 
				"1/8" : 1/8,
				"3/8" : 3/8,
				"5/8" : 5/8,
				"7/8" : 7/8
			};
			
		var curFr = 0, curFrLabel;
		
		if ( whole && rest ) {
			
			$.each(fracts, function(j, fr) {
				if ( rest - fr >= 0 && Math.abs(curFr - rest) > Math.abs(fr - rest) ) {
					curFr = fr;
					curFrLabel = j;
				}
			});
			
			if ( curFrLabel ) {
				out = (!whole ? "" : whole + " ") + curFrLabel;
			}
		}
		rest -= curFr;
		
		return {
			whole : whole,
			rest  : rest,
			out   : out,
			fraction : curFr
		};
	}
	
	$.each(["Years", "Months", "Weeks", "Days"], function(i, name) {
		
		// Disabled units
		if (!cfg[name]) {
			return true; // continue
		}
		
		var val   = interval["get" + name](),
			floor = Math.floor( val );
		
		if ( cfg.fractions ) {
			
			var frct = fraction( val );
			
			// Remove the current value from the interval before proceeding
			// with the next fraction
			interval["set" + name]( interval["get" + name]() - (frct.whole + frct.fraction));
			val = frct.out;
			
			if ( val ) {
				tmp = val + " " + cfg[val === 1 ? name.replace(/s$/i, "") : name];
				out.push( tmp );
			}
			
		} else {
			
			if ( floor ) {
				// Remove the current value from the interval before proceeding
				// with the next fraction
				interval._startDate["add" + name]( floor );
				
				tmp = floor + " " + cfg[floor === 1 ? name.replace(/s$/i, "") : name];
				out.push( tmp );
			}
		}
		
	});
	
	return out.join(cfg.separator);
};

GC.TimeInterval.prototype.onChange = function() {
	this._endDate.setTime(
		this._startDate.getTime() + 
		this._milliseconds
	);
};

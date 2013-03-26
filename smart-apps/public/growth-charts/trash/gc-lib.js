function extend( base, child )
{
	var F = function() {};
	F.prototype = base.prototype;
	F.prototype.constructor = F;
	child.prototype = new F;
}

// Constants
// =============================================================================
var DIRECTION = {
	TOP    : 2,
	RIGHT  : 4,
	BOTTOM : 8,
	LEFT   : 16
};

// Shape
// =============================================================================
function Shape() {}

Shape.prototype.getBox = function() 
{
	return new Rect( 0, 0, 0, 0 );
};

// Point 
// =============================================================================
extend( Shape, Point );
function Point( x, y ) 
{
	this.x = x;
	this.y = y;
}

Point.prototype.getBox = function() 
{
	return new Rect( this.x, this.Y, this.x, this.Y );
};

// Rect
// =============================================================================
function Rect( x1, y1, x2, y2 ) 
{
	this.x1 = x1;
	this.y1 = y1;
	this.x2 = x2;
	this.y2 = y2;
}

// PointSet
// =============================================================================
extend( Shape, PointSet );
function PointSet()
{
	this.points = [];
	this.length = 0;
}

PointSet.prototype.addPoint = function( point )
{
	this.length = this.points.push( point );
	return this;
};

PointSet.prototype.getMaxPoint = function( direction )
{
	var out, point;
	for ( var i = 0; i < this.length; i++ ) {
		point = this.points[i];
		switch ( direction ) {
			case DIRECTION.TOP:
				if (!out || out.y < point.y) out = point;
				break;
			case DIRECTION.RIGHT:
				if (!out || out.x < point.x) out = point;
				break;
			case DIRECTION.BOTTOM:
				if (!out || out.y > point.y) out = point;
				break;
			case DIRECTION.LEFT:
				if (!out || out.x > point.x) out = point;
				break;
		}
	}
	return out;
};

PointSet.prototype.getBox = function() 
{
	return new Rect( 
		this.getMaxPoint( DIRECTION.LEFT   ).x,
		this.getMaxPoint( DIRECTION.TOP    ).y,
		this.getMaxPoint( DIRECTION.RIGHT  ).x,
		this.getMaxPoint( DIRECTION.BOTTOM ).y
	);
};

// Line
// =============================================================================
extend( PointSet, Line );
function Line()
{
	this.points = [];
}

Line.prototype.toSVGPathSpec = function()
{
	var out = "";
	for ( var i = 0; i < this.length; i++ ) {
		out += (i ? " L " : "") + this.points[i].x + ", " + this.points[i].y;
	}
	if ( out ) {
		out = "M " + out;
	}
	return out;
};

// LineSet
// =============================================================================

function LineSet() 
{
	this.lines  = [];
	this.length = 0;
}

LineSet.prototype.addLine = function( line )
{
	this.length = this.lines.push( line );
	return this;
};

LineSet.prototype.getMaxPoint = function( direction )
{
	var out, point, set = new PointSet();
	for ( var i = 0; i < this.length; i++ ) {
		setAddpoint(this.lines[i].getMaxPoint( direction ));
	}
	return set.getMaxPoint( direction );
};

LineSet.prototype.getBox = function() 
{
	return new Rect( 
		this.getMaxPoint( DIRECTION.LEFT   ).x,
		this.getMaxPoint( DIRECTION.TOP    ).y,
		this.getMaxPoint( DIRECTION.RIGHT  ).x,
		this.getMaxPoint( DIRECTION.BOTTOM ).y
	);
};

// ShapeView
// =============================================================================
function ShapeView() {}

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

// LineSet
// =============================================================================
function Chart( pane ) 
{
	this.settings = GC.chartSettings;
	if ( pane ) {
		this.init( pane );
	}
}

Chart.prototype = {
	
	// Just in case, if nothing custom was set, draw 300x200 at 0x0
	width  : 300,
	height : 200,
	x      : 0,
	y      : 0,
	title  : "Title",
	
	dataSet : "",
	problemDataSet : "",
	
	init : function( pane ) 
	{
		this.pane   = pane;
		this.id     = GC.Util.uid();
		this._nodes = [];
		this._cache = {};
	},
	
	setWidth : function( w ) 
	{
		this.width = w;
		this.height = this.width * 3 / 4;
		return this;
	},
	
	getHeight : function() 
	{
		return this.height;
	},
	
	setX : function( x ) 
	{
		this.x = x;
		return this;
	},
	
	setY : function( y ) 
	{
		this.y = y;
		return this;
	},
	
	getUnits : function()
	{
		return GC.DATA_SETS[this.dataSet].units;
	},
	
	_scaleX : function(n, min, max) 
	{
		return GC.Util.scale (n, min, max, this.x, this.x + this.width);
	},
	
	_scaleY : function(n, min, max) 
	{
		return GC.Util.scale (
			n, 
			min, 
			max, 
			this.y + this.height - GC.chartSettings.chartLabels.attr["font-size"] * 1.3, 
			this.y + GC.chartSettings.chartLabels.attr["font-size"] * 1.3
		);
	},
	
	getMinY : function()
	{
		var data = this.getCurves( this.dataSet ), len = data.length;
		return len ? findMinMax( data[0], "y" ).min : 0;
	},
	
	getMaxY : function()
	{
		var data = this.getCurves( this.dataSet ), len = data.length;
		return len ? findMinMax( data[len - 1], "y" ).max : 0;
	},
	
	getCurves : function( dataSet ) 
	{
		if ( !this._cache.curves ) {
			this._cache.curves = {};
		}
		
		if ( !dataSet ) {
			return [];
		}
		
		if ( !this._cache.curves[dataSet] ) {
			this._cache.curves[dataSet] = [];
			
			var curvesData = GC.Util.getCurvesData( dataSet ),
				maxX       = GC.App.getEndAgeMos(),
				minX       = GC.App.getStartAgeMos();
			
			curvesData = GC.Util.cropCurvesDataX( curvesData, minX, maxX );
			
			var len = curvesData.length, dataLen, i, j, minY, maxY, out;
			
			if ( len && curvesData[0].data.length && curvesData[len-1].data.length) {
				minY = findMinMax(curvesData[0    ].data, "y").min;
				maxY = findMinMax(curvesData[len-1].data, "y").max;
				if ( dataSet !== this.dataSet ) {
					qY = this.getMaxY() / maxY;
				}
				
				for ( j = 0; j < len; j++ ) {
					dataLen = curvesData[j].data.length;
					out = [];
					for ( i = 0; i < dataLen; i ++ ) {
						out[i] = {
							x : this._scaleX(curvesData[j].data[i].x, minX, maxX),
							y : this._scaleY(curvesData[j].data[i].y, minY, maxY)
						};
					}
					this._cache.curves[dataSet].push( out );
				}
			}
		}
		return this._cache.curves[dataSet];
	},
	
	clear : function() 
	{
		this._cache = {};
		for ( var i = this._nodes.length - 1; i >= 0; i-- ) {
			this._nodes[i][this._nodes[i].type == "set" ? "clear" : "remove"]();
		}
		return this;
	},
	
	getValueAtX : function(x)
	{
		var data     = //GC.Util.cropCurvesDataX(
				GC.Util.getCurvesData( this.dataSet ),
				//GC.App.getStartAgeMos(),
				//GC.App.getEndAgeMos()
			//),
			linesLen = data.length,
			out      = [];
			
		if (linesLen < 1)
			return out;
		
		var before,
			after,
			ptA, ptB,
			points,
			pointsLen,
			i, val;
		
		// In all these charts the "x" is the age in moths
		x /= this.pane.month2pixel();
		x += GC.App.getStartAgeMos();
		
		for ( i = 0; i < linesLen; i++ ) {
			points    = data[i].data;
			pointsLen = points.length;

			if (!pointsLen)
				continue;
				
			ptA       = points[0],
			ptB       = points[pointsLen - 1],
			before    = { x : findMinMax(points, "x").min, y : ptA.y };
			after     = { x : findMinMax(points, "x").max, y : ptB.y };
			for ( j = 0; j < pointsLen; j++ ) {
				if (points[j].x < x && points[j].x > before.x) {
					before = points[j];
				}
				if (points[j].x > x && points[j].x < after.x) {
					after = points[j];
				}
			}
			
			val = GC.Util.getYatX(x, before.x, before.y, after.x, after.y);
			if ( !isNaN( val ) && isFinite( val ) ) {
				out[i] = GC.Util.getYatX(x, before.x, before.y, after.x, after.y);
			}
		}
		return out;
	},
	
	tooltip : function(x, y, line) 
	{
		var tt = $("#helper-tooltip");
		if (!tt.length) {
			tt = $('<div id="helper-tooltip"/>').appendTo("body");
		}
		
		var offset = $(this.pane.container).offset();
		var _x = x - offset.left - this.x;
		var _y = y - offset.top  - this.y;
		var month = Math.round((_x / this.pane.month2pixel()) * 100)/100;
		var week  = Math.round((_x / this.pane.week2pixel()) * 100)/100;
		var days  = Math.round((_x / this.pane.day2pixel()) * 100)/100;
		var years = Math.round((_x / 12 / this.pane.month2pixel()) * 100)/100;
		var values = this.getValueAtX(_x);
		
		values = values.reverse().join("<br/>         ");
		
		tt.html(
			       "chart-x: " + _x
			+ "<br/>chart-y: " + _y
			+ "<br/>values : " + values
			
			+ "<br/>years  : " + years
			+ "<br/>months : " + month
			+ "<br/>weeks  : " + week
			+ "<br/>days   : " + days
			
		).show();
		
		var w    = tt.outerWidth(),
			h    = tt.outerHeight(),
			ww   = $(window).width(),
			wh   = $(window).height(),
			left = x + 10,
			top  = y;
		
		if (top + h > wh) top -= h;
		if (left + w > ww) left -= w + 20;
		
		tt.css({
			left : Math.max(left, 0),
			top  : Math.max(top, 0)
		});
	},
	
	_getTopBoundaryPoints : function() 
	{
		var c = this.getCurves( this.dataSet ), l = c.length;
		return l ? c[l - 1] : [];
	},
	
	draw : function() 
	{
		this.clear();
		
		if (!this.dataSet) {
			return this.drawNoData();
		}
		
		var data          = this.getCurves( this.dataSet ),
			problemCurves = this.getCurves( this.problemDataSet ),
			len           = data.length;
			
		if ( len < 2 ) return this.drawNoData();
		
		var s     = GC.chartSettings,
			pcts  = GC.Preferences.prop("percentiles"),
			p     = [],
			n     = 0,
			elem, i, j, l, x, y, _x, _y, line;
			
		var minX     = GC.App.getStartAgeMos(),
			maxX     = GC.App.getEndAgeMos(),
			minY     = findMinMax(data[0    ], "y").min,
			maxY     = findMinMax(data[len-1], "y").max,
			minDataX = findMinMax(data[0    ], "x").min,
			maxDataX = findMinMax(data[0    ], "x").max;
		
		var problemRegion = this.drawProblemRegion();
		var fillRegion    = this.drawFillChartRegion(data);
		
		if (problemRegion && fillRegion) {
			var r1 = maxY - minY;
			var r2 = findMinMax(problemCurves[0], "y").min - findMinMax(data[problemCurves.length - 1], "y").min;
			problemRegion.attr("y", r2 - r1);
		}
		
		this.drawAxis(data, minY, maxY);
		
		
		
		// Chart lines
		// =====================================================================
		for ( j = 0; j < len; j++ ) {
			l = data[j].length;
			for ( i = 0; i < l; i++ ) { 
				_x = data[j][i].x;
				_y = data[j][i].y;
				
				// Clip each line with s.rightAxisInnerShadow.width pixels from 
				// it's right side (if it goes beyond that X coordinate)
				var x2= this.x + this.width - s.rightAxisInnerShadow.width;
				if ( _x > x2 ) { 
					_y = GC.Util.getYatX( x2, x, y, _x, _y );
					_x = x2;
				}
				
				x = _x;
				y = _y;
				
				p[n++] = (!i ? "M" : "L") + x + "," + y;
				
				// last point of each line - draw dot and line label
				if ( i === l - 1 ) { 
					var txt = String(pcts[j].toFixed(2)).replace("0.", "");
					this._nodes.push(this.pane.paper.circle(x, y, 2.5).attr({
						fill: this.settings.lines.stroke,
						"stroke-width": 0
					}));
					this._nodes.push(this.pane.paper.text(x + 11, y, txt).attr({
						"text-anchor" : "left",
						"stroke" : GC.Util.mixColors(GC.Util.mixColors(this.settings.lines.stroke, "#FFF"), "#FFF"),
						"stroke-width"   : 3,
						"stroke-opacity" : 1//.5
					}));
					this._nodes.push(this.pane.paper.text(x + 11, y, txt).attr({
						"text-anchor" : "left",
						fill: this.settings.lines.stroke
					}));
				}
			}
			
			// Bottom-most line decoration (shadow)
			if (!j) {
				line = this.pane.paper.path().attr({
					"stroke-width": 2,
					"stroke-opacity": 0.3,
					"path": p
				});
				
				this._nodes.push(line);
				this._nodes.push(line.glow({
					width   : 3,
					fill    : false,
					opacity : 0.15,
					offsetx : 0,
					offsety : 2,
					color   : "black"
				}));
			}
		}
		
		if ( n ) {
			
			elem = this.pane.paper.path().attr(this.settings.lines).attr("path", p);
			
			// Show helper tooltip
			if ( GC.App.DEBUG_MODE ) {
				var inst = this;
				elem.mousemove(function(e, x, y) {
					inst.tooltip(x, y, this);
				});
			}
			
			this._nodes.push(elem);
		}
		
		this.drawPatientData(minX, maxX, minY, maxY, minDataX, maxDataX);
		this.drawTitle(minY, maxY);
		
		if (GC.App.DEBUG_MODE) {
			this.pane.paper.rect(this.x, this.y, this.width, this.height)
				.attr({ 
					//fill: "#888", 
					//"fill-opacity" : .1, 
					"stroke-width" : 0 
				})
				
				.toBack()
				.addClass("chart-rect");
		}
		
		return this;
	},
	
	drawNoData : function()
	{
		this.clear();
		this.pane.paper.text(
			this.x + this.width / 2, 
			this.y + this.height / 2, 
			"No data available!"
		).attr({
			"font-size" : 30,
			"fill" : "#A60",
			"fill-opacity" : 0.4
		});
	},
	
	drawTitle : function(minY, maxY)
	{
		// The text to display
		var titleText = this.title + " (" + this.getUnits() + ")";
		
		// The style and attributes to set
		var titleAttr = $.extend({}, GC.chartSettings.chartLabels.attr, {
			fill : this.settings.lines.stroke
		});
		
		// Now check if the text should be curved, or rotated or displayed 
		// horizontally
		var doRotate  = Raphael.vml, 
			doCurve   = Raphael.svg,
			refPoints = this._getTopBoundaryPoints(),
			l         = refPoints.length;
			
		// If there is no chart data or it end before the end of the title 
		// rectangle - render horizontal title without any FX
		if ( !l || refPoints[ l - 1 ].x < this.x + this.width * .85) {
			doRotate = false;
			doCurve = false;
		}
		
		// Try to render curved text on SVG browsers
		if ( doCurve ) {
			
			// Create path string from the topBoundaryPoints array
			var p = "", i;
			for ( i = 0; i < l; i++ ) {
				p += (i && i % 2 ? " L " : " ") + refPoints[i].x + ", " + refPoints[i].y;
			}
			
			if (p) {
				var refId = this.id + "titlepath";
				
				// Create the reference path in defs if needed
				var path = document.getElementById(refId);
				if (!path) {
					path    = document.createElementNS("http://www.w3.org/2000/svg", "path");
					path.id = refId;
					path.setAttribute("transform", "translate(0, -12)");
					path.setAttribute("d", "M " + p);
					this.pane.paper.defs.appendChild(path);
				}
				
				var txt  = document.createElementNS("http://www.w3.org/2000/svg", "text");
				for ( var attr in titleAttr ) {
					txt.setAttribute(attr, titleAttr[attr]);
				}
				txt.setAttribute("class", "chart-title-curved"); // Some CSS extras
				
				path = document.createElementNS("http://www.w3.org/2000/svg", "textPath");
				path.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#" + refId);
				path.setAttribute("startOffset", "90%");
				path.setAttribute("text-anchor", "end");
				path.appendChild(document.createTextNode(titleText));
				this.pane.paper.canvas.appendChild(txt);
				txt.appendChild(path);
				return;
			}
		}
		
		// Render "normal" horizontal title
		var txt = this.pane.paper.text().attr(titleAttr).attr({
			x   : this.x + (this.width - GC.chartSettings.rightAxisInnerShadow.width) * 0.9,
			y   : this.y + GC.chartSettings.chartLabels.attr["font-size"] / 2,
			text: titleText
		});
		
		// Rotate the title (used on VML only)
		if ( doRotate ) {
			var vals;
			var box = txt.getBBox();
			
			vals = this.getValueAtX( box.x );
			var p1 = {
				x : box.x,
				y : this._scaleY(vals[vals.length - 1], minY, maxY)
			};
			
			vals = this.getValueAtX( box.x2 );
			var p2 = {
				x : box.x2,
				y : this._scaleY(vals[vals.length - 1], minY, maxY)
			};
			var angle = 360 - Raphael.angle( p2.x, p2.y, p1.x, p1.y );
			
			vals = this.getValueAtX( box.x + box.width/2 );
			
			
			txt.attr({
				"transform": "r-" + angle,
				y : this._scaleY(vals[vals.length - 1], minY, maxY) - GC.chartSettings.chartLabels.attr["font-size"] 
			});
		}
		
		this._nodes.push(txt);
	},
	
	/**
	 * Draws left and right axis, axis labels and other related decorations.
	 */ 
	drawAxis : function(data, minY, maxY)
	{
		var range = Math.ceil( maxY - minY ),
			minYleft,
			minYright,
			i, x, y, p;
		
		if (!range) return this;
			
		for ( i = Math.ceil(minY); i <= maxY; i = Math.ceil(i + range/10) ) {
			
			y = this._scaleY( i, minY, maxY );
			
			// Left label
			this._nodes.push(
				this.pane.paper.text(this.x - 6, y, i)
					.attr("text-anchor", "end").attr(this.settings.axisLabels)
			);
			
			// Right label
			this._nodes.push(
				this.pane.paper.text(this.x + this.width + 6, y, i)
					.attr("text-anchor", "start").attr(this.settings.axisLabels)
			);
			
			// Horizontal grid line
			p = this.pane.paper.path(
				"M" + (this.x - 2) + "," + y + "H" + (this.x + this.width + 2)
			)
			.attr(GC.chartSettings.gridLineX)
			.addClass("grid-line-x");
			this._nodes.push(p);
		}
		
		// Units
		var units = this.getUnits();
		this._nodes.push(
			this.pane.paper.text(this.x - 4, this.y + 1, units)
				.attr(this.settings.axisLabels)
				.attr({ "text-anchor": "end", "font-weight" : "bold" })
		);
		this._nodes.push(
			this.pane.paper.text(this.x + this.width + 4, this.y + 1, units)
				.attr(this.settings.axisLabels)
				.attr({ "text-anchor": "start", "font-weight" : "bold" })
		);
		
		y = Math.min(this._scaleY( Math.round(minY * .95), minY, maxY ), this.y + this.height);
		this._nodes.push(this.pane.paper.path([
			
			"M" + (this.x - 3) + "," + this.y + "H" + (this.x + 2),
			"M" + (this.x + this.width - 2) + "," + this.y + "H" + (this.x + this.width + 3),
			"M" + (this.x - 3) + "," + y + "H" + (this.x + 2),
			"M" + (this.x + this.width - 2) + "," + y + "H" + (this.x + this.width + 3),
			
			"M" + this.x + "," + this.y + "V" + y,
			"M" + (this.x + this.width) + "," + this.y + "V" + y
		]).attr(this.settings.axis).addClass("crispedges"));
		
		return this;
	},
	
	drawProblemRegion : function()
	{
		if ( !GC.App.getCorrectionalChartType() ) {
			return;
		}
		
		if ( this.problemDataSet ) {
			var data = this.getCurves( this.problemDataSet ),
				len  = data.length;
				
			if ( len > 1 && data[0].length ) {
				return this.drawFillChartRegion(data).attr(this.settings.problemRegion);
			}
		}
		
		var msg = this.title + " chart:\n"
			+ "There is no data for the selected problem for the current "
			+ "age interval.";
			
		var ds = GC.DATA_SETS[this.problemDataSet];
		
		if ( ds ) {
			msg += "\nDetails:\n-------------------------------------------\n";
			msg += "name : " + ds.source + "\n";
			msg += "description : " + ds.description;
		}
		
		debugLog( msg );
	},
	
	drawFillChartRegion : function(data)
	{
		var l = data.length;
		
		if (!l || !data[0].length) {
			return;
		}
		
		var i, p = [], n = 0;
		
		
		for ( i = data[0].length - 1; i >= 0; i-- ) {
			p[n++] = [ data[0][i].x, data[0][i].y ];
		}
		
		p[n++] = [ data[l - 1][0], data[l - 1][1] ];
		
		for ( i = 0; i < data[l - 1].length; i++ ) {
			p[n++] = [ data[l - 1][i].x, data[l - 1][i].y ];
		}
		
		p = $.map(p, function(item, index) {
			return (index ? "L" : "M") + item.join(",");
		}).join("");
		
		p = this.pane.paper.path().attr(this.settings.fillRegion || {
			"stroke-width"   : 0, 
			"fill"           : this.settings.lines.stroke,
			"fill-opacity"   : 0.3
		}).attr("path", p + "Z");
		
		this._nodes.push(p);
		
		return p;
	},
	
	drawPatientData : function(minX, maxX, minY, maxY, minDataX, maxDataX)
	{
		var points = this.getPatientDataPoints( minX, maxX, minDataX, maxDataX ), 
			p   = [], 
			c   = [],
			c2  = [],
			s   = GC.chartSettings.patientData,
			x, y, lastX, lastY, i, sNow, n = 0, elem, point = 0;
		
		
		points = GC.Util.cropPatientDataX( 
			points, 
			minX, 
			maxX - GC.chartSettings.rightAxisInnerShadow.width / this.pane.month2pixel(),
			minY, 
			maxY
		);
		var len = points.length;
		
		for ( i = 0; i < len; i++ ) {
			point = points[i];
			x = this._scaleX( point.agemos, minX, maxX );
			y = this._scaleY( point.value , minY, maxY );
			
			sNow = s.points[point.agemos <= 1 ? "firstMonth" : i === len - 1 ? "current" : i % 2 ? "odd" : "even"];
			
			var drawDot = !point.overflow;
			if (points.croppedBefore && i === 0)
				drawDot = false;
			if (points.croppedAfter && i === len - 1)
				drawDot = false;
			
			p[n++] = ( point.overflow ? "M" : "L" ) + x + "," + y;
			
			if (drawDot) {
				c2[n] = $.extend({}, sNow, {
					type : "circle",
					cx   : x,
					cy   : y,
					r    : 3
				});
				
				c[n] = {
					type : "circle",
					cx   : x,
					cy   : y,
					r    : 2,
					fill : i === len - 1 || i % 2 ? this.settings.pointsColor : GC.Util.brighten(this.settings.pointsColor),
					"stroke-width" : 0
				};
			}
		}
		
		var inst = this;
		elem = this.pane.paper.path(p.join("").replace(/^L/, "M")).attr(s.lines);
		if ( points.croppedAfter ) {
			elem.attr("arrow-end", "classic-wide-long");
		}
		if ( GC.App.DEBUG_MODE ) {
			elem.mousemove(function(e, x, y) {
				inst.tooltip(x, y, this);
			});
		}
		this._nodes.push(elem);
		
		c2 = this.pane.paper.add(c2);
		
		this._nodes.push(c2.glow({
			width   : 4,
			fill    : true,
			opacity : 0.5,
			offsetx : 0,
			offsety : 2,
			color   : "black"
		}));
		this._nodes.push(c2);
		
		c = this.pane.paper.add(c);
		
		this._nodes.push(c.glow({
			width   : 0.2,
			fill    : false,
			opacity : 0.4,
			offsetx : 0,
			offsety : 0,
			color   : this.settings.pointsColor
		}));
		this._nodes.push(c);
		
		
		return this;
	},
	
	setDataSource : function() 
	{
		throw "Chart.setDataSource is an abstract method.\nYou must redefine \
			it in the sub-classes.";
	},
	
	setProblem : function()
	{
		return this;
	},
	
	getPatientDataPoints : function( type, minX, maxX, minDataX, maxDataX ) 
	{
		var points = GC.App.getPatient().data[type], 
			len    = points.length,
			out    = [], 
			min    = Math.max(GC.App.getStartAgeMos(), minDataX),
			max    = Math.min(GC.App.getEndAgeMos(), maxDataX),
			ptPrev, 
			ptNext,	
			i;
			
		for ( i = 0; i < len; i++ ) {
			if ( points[i].agemos < min ) {
				if ( !ptPrev || ptPrev.agemos < points[i].agemos ) {
					ptPrev = points[i];
				}
			}
			else if ( points[i].agemos > max ) {
				if ( !ptNext || ptNext.agemos > points[i].agemos ) {
					ptNext = points[i];
				}
			}
			else {
				out.push( points[i] );
			}
		}
		
		if ( ptPrev ) out.unshift( ptPrev );
		if ( ptNext ) out.push( ptNext );
		
		return out;
	}
};


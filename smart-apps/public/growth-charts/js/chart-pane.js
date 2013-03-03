/*global 
Chart, GC, PointSet, strPad, weeks2months, Raphael, console, getLineXatY, $,
jQuery, debugLog, cropCurvesDataX, getCurvesData, getYatX, findMinMax, scale,
sumLinesY, getLinesMinDistanceY, months2weeks, XDate, setTimeout*/

/*jslint eqeq: true, nomen: true, plusplus: true, forin: true*/
"use strict";

function ChartPane( paper )
{
	this.id = Raphael.createUUID();
	
	this.paper = paper;
	
	this.container = paper.canvas.parentNode;
	
	this.doc = this.container.ownerDocument;
	
	/**
	 * Cache some things internally. This cache is cleared before each re-draw.
	 */
	this.__CACHE__ = {};
	
	this.charts = [];
	
	this.topgutter    = GC.chartSettings.topgutter   // + 16;
	this.bottomgutter = GC.chartSettings.bottomgutter// + 16;
	
	this._init();
}

ChartPane.prototype = {
	
	width : 0,
	
	height: 0,
	
	minWidth : 1095,
	
	minHeight : 300,
	
	maxWidth : GC.chartSettings.maxWidth,
	
	maxHeight : 3600,
	
	minColumnWidth : 30, // %
	
	maxColumnWidth : 70, // %
	
	_init : function() {
		
		var inst = this, x;
		
		$(this.container).css({
			"maxWidth" : this.maxWidth
		});
		
		$("#timeline-bottom, #timeline-top", this.doc).css({
			"paddingRight" : $("#stage", this.doc)[0].offsetWidth - $("#stage", this.doc)[0].clientWidth
		})
		.find("> div").css({
			"maxWidth" : this.maxWidth
		});
		
		// When to re-draw
		$("html", this.doc).bind([
			"set:gender", 
			"set:percentiles", 
			"set:weeks",
			"set:primaryData",
			"set:secondaryData",
			"set:showPretermArrows",
			//"set:metrics",
			//"set:PCTZ",
			"set:language",
			"set:gestCorrectionDuration",
			"set:gestCorrectionType",
			"set:correctionAge",
			"set:gestationAge"
		].join(" "), function() { 
			inst.draw(); 
		});
		
		GC.Preferences.bind("set:metrics set:pctz set:aspectRatio", function() { 
			inst.draw(); 
		});
		
		GC.Preferences.bind("set:maxWidth", function(e) { 
			//console.log(e);
			var maxWidth = GC.Util.floatVal(e.data.newValue);
			inst.maxWidth = maxWidth;
			$(inst.container).css({
				"maxWidth" : maxWidth
			});
			$("#timeline-bottom > div, #timeline-top > div", this.doc).css({
				"maxWidth" : maxWidth
			});
			inst.draw(); 
		});
		
		// Any instance method starting with "_init__" is auto-invoked by the 
		// constructor
		for ( x in this) {
	        if (x.indexOf("_init__") === 0 && typeof this[x] == "function" ) {
                this[x]();
            }
		}
	},
	
	/**
	 * In DEVELOPMENT mode display the mouse coordinates on the paper 
	 */
	_init__mouseTracking : function() {
		if ( GC.chartSettings.mouseTrackingEnabled) {
			$("body").on("mousemove", "svg", function(e) {
				var offset = $(this).offset();
				$("#mouse-coords").text(
					"x:" + (e.pageX - offset.left) + " " + 
					"y:" + (e.pageY - offset.top)
				);
			});
		}
	},
	
	/**
	 * Refine the divider position to be in the center of the scrollable area
	 * (scrollbar width compensation) 
	 */
	_init__divider : function() {
		if ($("html").is(".before-print")) {
			return true;
		}
		
		var divider = $("#middle-indicator"),
            stage   = $("#stage"),		      
			inst    = this,
			fixed;
		
		divider.css(
			"marginLeft",
			(stage[0].clientWidth - stage[0].offsetWidth)/2 - 
			divider.width()/2
		);
		
		// By default (initially) the divider stays centered and has left:50% 
		// plus some margin compensation. However, after a resizing is applied,
		// it switches to pixel position and that position must be updated on 
		// window.resize.
		function fixDivider() {
		    if ( !fixed ) {
		        fixed = true;
		        $(window).bind("scroll resize", function() {
		            var diff = parseFloat(divider.css("marginLeft")) + 
                        divider.width() / 2;
		            divider.css(
		                "left", 
		                inst.container.offsetLeft + 
		                inst.getColumnWidth(0) -
		                diff
		            );
		        });
		    }
		}
		
		divider.bind("mouseenter", function() {
			if (GC.chartSettings.columnResizing.enabled) {
				$(this).css({
	                "cursor" : "e-resize"//,
	                //"pointer-events": "auto"
	            }).css("cursor", "col-resize");
           } else {
				$(this).css({
	                "cursor" : "default"//,
	                //"pointer-events": "none"
	            });
           }
		});
		
		// Act as column resizer
		divider.bind("mousedown", function(e) {
			
			if (!GC.chartSettings.columnResizing.enabled) {
				return false;
			}
			
			divider.addClass("active");
			
			var root = $.browser.msie ?
					 document.documentElement || document.body : 
					 window,
				
				diff = parseFloat(divider.css("marginLeft")) + 
					divider.width() / 2,
				
				total = inst.container.offsetWidth - 
				   GC.chartSettings.leftgutter - 
				   GC.chartSettings.rightgutter,
				
				min = inst.container.offsetLeft + 
				   inst.container.offsetWidth * GC.chartSettings.columnResizing.minWidth +
				   GC.chartSettings.leftgutter +
                   GC.chartSettings.rightgutter,
				
				max = inst.container.offsetLeft + 
				   inst.container.offsetWidth * GC.chartSettings.columnResizing.maxWidth -
                   GC.chartSettings.leftgutter -
                   GC.chartSettings.rightgutter,
				
				startX = Math.max(Math.min(e.pageX - diff, max), min),
				
				x = startX;
			
			$(root).bind({
				"mousemove.dragmiddleindicator" : function(e) {
					e.preventDefault();
					e.stopPropagation();
					e.stopImmediatePropagation();
					x = Math.max(Math.min(e.pageX - diff, max), min);
					divider.css("left", x);
					return false;
				},
				"mouseup.dragmiddleindicator" : function(e) {
					$(this).unbind(".dragmiddleindicator");
					divider.removeClass("active");
					
					if ( Math.abs(startX - x) > 1) {
                        inst.setColumnWidth(
                            0, 
                            x - inst.container.offsetLeft + diff
                        ).draw();
                        
                        divider.css(
                            "left", 
                            inst.getColumnWidth(0) + inst.container.offsetLeft - diff
                        );	
                        
                        fixDivider();
					}
				}
			});
			return false;
		});
	},
	
	/**
	 * Attaches the event handles that are responsible zoom-selection. 
	 */
	_init__zoom : function() {
		if ($("html").is(".before-print")) {
			return true;
		}
		
		var inst = this;
		$(this.container).on("mousedown", function(e) {
			
			var offset    = $(this).offset(),
				startX    = e.pageX - offset.left,
				colIndex  = inst.getColIndexAtX(startX),
				colLeft   = inst.getColumnLeft(colIndex) + GC.chartSettings.leftgutter,
				colRight  = colLeft + inst.getColumnWidth( colIndex, true ),
				started   = false,
				valid     = false,
				root, rect;
			
			// Ignore the event if it's out of the column
			if ( startX < colLeft || startX > colRight ) {
				return true;
			}
			
			// Ignore the event if already in max zoom
			//var gap = inst.pixelsPerWeek();
			if ( GC.App.getWeeks() <= GC.chartSettings.minTimeInterval / GC.Constants.TIME.WEEK ) {
				return true;
			}
			
			root = $.browser.msie ? 
				document.documentElement || document.body : 
				window;
			
			rect = inst.paper.rect()
				.attr(GC.chartSettings.selectionRect)
				.attr({
                    x      : startX,
                    y      : 0,
                    height : inst.height - 1,
                    width  : 0
                }).addClass("crispedges");
			
			$(root).bind({
				"mouseup.dragSelectionRect" : function(e) {
					$(inst.container).css("cursor", "");
					$(root).unbind(".dragSelectionRect");
					
					if ( started && valid ) {
						var box   = rect.getBBox(),
							start = inst.x2weeks( box.x ),
							end   = inst.x2weeks( box.x2 );
						
						GC.App.setStartWeek(start, true);
						GC.App.setEndWeek(end);
					}
					
					rect.remove();
					
					return valid;
				},
				"mousemove.dragSelectionRect" : function(e) {
                    var x  = Math.min(
                        Math.max(e.pageX - offset.left, colLeft), 
                        colRight
                    ), left, width, startTime, endTime;
                    
                    // Min. 5px are needed to start drawing a rect. This should 
                    // filter small mouse moves while clicking.
					if (started || Math.abs(x - startX) > 5) {
						
						left      = Math.min(x, startX);
						width     = Math.abs(x - startX);
						startTime = inst.x2weeks(left) * GC.Constants.TIME.WEEK;
						endTime   = inst.x2weeks(left + width) * GC.Constants.TIME.WEEK;
						
						if (endTime - startTime < GC.chartSettings.minTimeInterval) {
							rect.attr("fill-opacity", 0);
							valid = false;
						} else {
							rect.attr("fill-opacity", GC.chartSettings.selectionRect["fill-opacity"]);
							valid = true;
						}
												
						if ( !started ) {
							// Change the cursor when drawing the rect for the 
							// first time
							$(inst.container).css("cursor", "e-resize");
							started = true;
						}
						
						rect.attr({
							width : width,
							x     : left
						});
						return false;
					}
				}
			});
			return false;
		});
	},
	
	_init__annotations : function() {
		
		// Any click or mousedown (if not stopped) will hade any opened 
		// annotation popups
		$("html").on("click mousedown", function() {
			$(".annotations .annotation-button").removeClass("active");
		});
		
		$(this.container)
	
		// mousedown and mousemove events inside an annotation popup are stopped
		.on(
			"mousedown mousemove", 
			".annotations .annotation-button .details", 
			function(e) { 
				e.stopPropagation(); 
			}
		)
		
		// Click inside an annotation popup is canceled (otherwise it toggle 
		// it's visibility)
		.on("click", ".annotations .annotation-button .details", false)
		
		.on("mousedown", ".annotations .annotation-button .details", function(e) {
			e.stopPropagation();
		})
		
		.on("click", ".annotations .annotation-button", function() {
			$(this).toggleClass("active").siblings().removeClass("active");
			if ($(this).is(".active")) {
				var d = $(this).find(".details"),
					hasSpace = $(this).offset().left + d.outerWidth() < $("#stage").offset().left + $("#stage").width();
				$(this).toggleClass("to-left", !hasSpace)
					.toggleClass("to-right", hasSpace);
			}
			return false;
		});
	},
	
	_init__dblclickEdits : function() {
		if ($("html").is(".before-print")) {
			return true;
		}
		
		var inst = this;
		
		$(this.container).on("dblclick", function(e) {
			if (GC.chartSettings.pointDoubleClickEdit) {
				var record = GC.SELECTION.selected.record;
				if (record) {
					GC.App.editEntry(record);
					return false;
				}
			}
		});
	},
	
	_init__timelines : function() {
        var inst = this, hlt;
        
		$("body")
        .on("click", ".timeline .weeks .labels div", function() {
			if (GC.chartSettings.timeline.interactive) {
	            GC.App.setSelectedAgemos(
					GC.Util.floatVal(this.innerHTML) / GC.Constants.TIME_INTERVAL.WEEKS_IN_MONTH,
					"selected"
				);
	            return false;
           }
        })
        .on("click", ".timeline .months .labels div", function() {
            if (GC.chartSettings.timeline.interactive) {
	            GC.App.setSelectedAgemos(
					GC.Util.floatVal(this.innerHTML),
					"selected"
				);
				return false;
            }
        })
        .on("click", ".timeline .years .labels div", function() {
            if (GC.chartSettings.timeline.interactive) {
	            GC.App.setSelectedAgemos(
					GC.Util.floatVal(this.innerHTML) * 12,
					"selected"
				);
	            return false;
            }
        })
        .on("click", ".timeline .days .labels div", function() {
            if (GC.chartSettings.timeline.interactive) {
	            GC.App.setSelectedAgemos(
					GC.Util.floatVal(this.innerHTML) / GC.Constants.TIME_INTERVAL.DAYS_IN_MONTH,
					"selected"
				);
	            return false;
            }
        })
        .on("mousemove", ".timeline .labels div", function(e) {
            if (GC.chartSettings.timeline.interactive) {
	            var start = GC.Util.floatVal(
	                    this.getAttribute("startAge"), 
	                    Number.MAX_VALUE
	                ),
	                end = GC.Util.floatVal(
	                    this.getAttribute("endAge"), 
	                    Number.MIN_VALUE
	                ),
	                range,
	                time,
	                left, 
	                width;
	                
	            if (start < end) {
	                range = end - start;
	                left  = e.pageX - $(this).offset().left;
	                width = $(this).width();
	                time  = start + range * ( left / width);
	                inst.highlightAge( time, "hover" );
	            }
            }
        })
        .on("mouseleave", ".timeline .labels div", function() {
            if (GC.chartSettings.timeline.interactive) {
				$(".timeline .labels > div").removeClass("hover");
            }
        })
        .on("mouseleave mouseenter", ".timeline", function() {
			$(".timeline").toggleClass("interactive", GC.chartSettings.timeline.interactive);
        });
        
        
        // higlightTimelineRanges
        hlt = $('<div class="range-highlight"/>').appendTo(".stage-1");
        $("body")
        .on("mouseenter", ".timeline .labels div", function(e) {
            if (GC.chartSettings.higlightTimelineRanges) {
            hlt.css({
                left    : this.offsetLeft + inst.getColumnLeft(
                    inst.getColIndexAtX(e.pageX - inst.container.offsetLeft)
                ),
                width   : this.offsetWidth,
                display : "block"
            });
            }
        })
        .on("mouseleave", ".timeline .labels div", function() {
            if (GC.chartSettings.higlightTimelineRanges) {
				hlt.css("display", "none");
            }
        });

	},
	
	/**
	 * Finds all the tags on the timelines having time range that contains the 
	 * given age and highlights them (unly uses the most granulated row!).
	 * @param {Number} age The age to select in miliseconds
	 * @param {String} className The className to toggle
	 * @returns {jQuery} The filtered elements 
	 */
	highlightAge : function(age, className) {
		var granularity = {
				"days"   : 0,
				"weeks"  : 1,
				"months" : 2,
				"years"  : 3
			}, 
			granularityIndex = 3,
			granularityClass = "years";
        
        return $(".timeline .labels > div")
        .removeClass(className)
        .filter(function() {
            var start = GC.Util.floatVal(this.getAttribute("startAge"), Number.MAX_VALUE),
                end   = GC.Util.floatVal(this.getAttribute("endAge"  ), Number.MIN_VALUE);
            return start <= age && end >= age;
        })
        .each(function() {
			var $elem = $(this);
			$.each(granularity, function(className, index) {
				if ($elem.is("." + className + ".visible .labels > div") && index < granularityIndex) {
					granularityIndex = index;
					granularityClass = className;
				}
			});
        })
        .filter("." + granularityClass + " .labels > div")
        .addClass(className);
    },
	
	/**
	 * 
	 */
	forEachChart : function( callback )
	{
		var col     = null, 
			exit    = null,
			colsLen = this.charts.length,
			rowsLen = 0,
			colIndex,
			rowIndex,
			chart;
		
		for ( colIndex = 0; exit !== false && colIndex < colsLen; colIndex++ ) {
			col = this.charts[colIndex];
			rowsLen = col.length;
			for ( rowIndex = 0; exit !== false && rowIndex < rowsLen; rowIndex++ ) {
				chart = col[rowIndex].chart;
				exit = callback.call( chart, chart, colIndex, rowIndex, rowsLen, colsLen );
			}
		}
		return this;
	},
	
	forEachColumn : function( callback )
	{
		var col     = null, 
			exit    = null,
			colsLen = this.charts.length,
			colIndex;
			
		for ( colIndex = 0; exit !== false && colIndex < colsLen; colIndex++ ) {
			col = this.charts[colIndex];
			exit = callback.call( col, col, colIndex, colsLen );
		}
	},
	
	empty : function() 
	{
		this.__CACHE__ = {};
		this.forEachChart(function() {
			this.clear();
		});
		this.charts = [];
		this.paper.clear();
		return this;
	},
	
	getColumnCount : function() 
	{
		return this.charts.length;
	},
	
	getColumnWidth : function( colIndex, inner ) 
	{
		var out = this.charts[ colIndex ].width,
			w   = out,
			n, i;
		if ( !w && w !== 0 ) {
			w = this.width; 
			n = this.charts.length;
			for ( i = 0; i < this.charts.length; i++ ) {
				if (this.charts[i].width) {
					w -= this.charts[i].width;
					n--;
				}
			}
			out = w / n;
		}
		
		if ( inner ) {
			out -= GC.chartSettings.leftgutter + GC.chartSettings.rightgutter;
		}
		
		return out;
	},
	
	setColumnWidth : function( colIndex, w ) 
	{
		w = GC.Util.floatVal( w, this.width/2 );
		w = Math.max( 
			Math.min(w, this.width * this.maxColumnWidth / 100), 
			this.width * this.minColumnWidth / 100
		);
		this.charts[colIndex].width = w;
		return this;
	},
	
	getColumnLeft : function( colIndex ) 
	{
		if (!colIndex) {
			return 0;
		}
		var out = 0, i;
		for ( i = 0; i <= colIndex && i < this.charts.length - 1; i++ ) {
			out += this.getColumnWidth( i );
		}
		return out;
	},
	
	getColIndexAtX : function( x ) 
	{
		var out = 0, len = this.getColumnCount();
		while ( this.getColumnLeft( out ) + this.getColumnWidth( out ) < x ) {
			if (++out >= len) {
				return 0; //-1; 
			}
		} 
		return out;
	},
	
	addChart : function( chart, colIndex ) 
	{
		if ( !(chart instanceof Chart || chart instanceof GC.App.Charts["Chart Stack"]) ) {
			throw "Only 'Chart' derivates can be added to the ChartPane";
		}
		
		var container = this.charts[colIndex];
		if ( !$.isArray( container ) ) {
			container = [];
			this.charts[ colIndex ] = container;
		}
		
		chart.init(this);
		chart.colIndex = colIndex;
		chart.rowIndex = container.push({ 
			colIndex : colIndex,
			chart    : chart,
			rowIndex : -1
		}) - 1;
		
		return this;
	},
	
	draw : function() 
	{
		$("#helper-tooltip").hide();
		
		if ( !$(this.container).is(":visible") ) {
			return;
		}
		
		if ( GC.chartSettings.timeLogsEnabled ) {
			console.time( "Time for 'draw()'" );
		}
		
		//if ( GC.App.DEBUG_MODE ) console.profile( "drawCharts" );
		this.__CACHE__ = {};
		this.paper.clear();
		this.width  = this.container.clientWidth;
		this.height = this.container.clientHeight;
		this.drawAnnotations();
		this.drawTimelines();
		this.drawCharts();
		this.paper.setSize( this.width, this.height );
		
		
		
		var inst = this;
		setTimeout(function() { 
			inst.drawToday();
			
			inst.restoreSelection(); 
		}, 0);
		
		//if ( GC.App.DEBUG_MODE ) console.profileEnd( "drawCharts" );
		if ( GC.chartSettings.timeLogsEnabled ) {
			console.timeEnd( "Time for 'draw()'" );
		}
	},
	
	drawCharts : function() 
	{
		this.container.style.height = "1px";
		
		var chartType1 = GC.App.getPrimaryChartType(),
			chartType2 = GC.App.getCorrectionalChartType(),
			s          = GC.chartSettings,
			y          = 0,
			chartAbove = null,
			inst       = this,
			outH       = 0,
			shifts     = [],
			i          = 0,
			hBefore,
			width      = $(this.container).width(),
			hAvail     = String(GC.chartSettings.aspectRatio) == "0" ?
				$("#stage").height()                 - this.topgutter - this.bottomgutter : 
				width * GC.chartSettings.aspectRatio - this.topgutter - this.bottomgutter;
				
		this.forEachChart(function(chart, colIndex, rowIndex, rowsLen, colsLen) {
			
			var topOutline, 
				bottomOutline, 
				diff = null, 
				shift = 0,
				rowHeight;
			
			// On each chart at first row
			if ( rowIndex === 0 ) {
				y = inst.topgutter;
				chartAbove = null;
			}
			
			// First chart at the second row
			if ( colIndex === 1 && rowIndex === 0 ) {
			    
			    // From now on the hAvail will be based on whatever has been 
			    // drown at the first column
				hAvail = outH - inst.topgutter - s.chartSpaceY * (inst.charts[0].length - 1);
			}
			
			rowHeight = (hAvail - s.chartSpaceY * (rowsLen - 1)) / rowsLen;
			
			if (chart instanceof GC.App.Charts["Percentile Chart"]) {
				rowHeight *= 0.64;
			} else if (chartAbove && chartAbove instanceof GC.App.Charts["Percentile Chart"]) {
				rowHeight *= 1.36;
			}
			
			chart.clear();
			chart.isInLastRow = rowIndex === rowsLen - 1;
			chart.colIndex = colIndex;
			chart.rowIndex = rowIndex;
			chart.setWidth(inst.getColumnWidth(colIndex) - s.leftgutter - s.rightgutter)
				 .setHeight(rowHeight)
				 .setX(inst.getColumnLeft(colIndex) + s.leftgutter)
				 .setY(y)
				 .setDataSource(chartType1)
				 .setProblem(chartType2);
				 
			// Shift -----------------------------------------------------------
			if ( rowIndex > 0 && s.verticalShift.enabled ) {
				topOutline    = chart.get("topOutline");
				bottomOutline = chartAbove.get("bottomOutline");
				diff          = getLinesMinDistanceY(
					bottomOutline, 
					topOutline, 
					s.verticalShift.ticks
				); 
				
				if (diff && diff.distance > 0) { 
					shift = s.chartSpaceY - diff.distance;
					
					// shift is the extra space available. Scale the related 
					// chart vertically to compensate it 
					hBefore = chartAbove.getHeight();
					var h2 = chart.getHeight();
					chartAbove.setHeight(hBefore + shift * -0.7);
					chart     .setHeight(h2      + shift * -0.7);
					
					// Compensate the growing of the top chart;
					y += hBefore - chartAbove.getHeight();
					
					chart.setY(y);
				}
				shifts[i++] = { diff : diff, shift : shift };
			} else {
			    shifts[i++] = null;
			}
			// -----------------------------------------------------------------
			
			y += chart.getHeight();
			y += s.chartSpaceY;
			
			chartAbove = chart;
			outH = Math.max(outH, y);
		});
		
		outH += this.bottomgutter - s.chartSpaceY;
		
		outH = Math.max(outH, $("#stage").height());
		
		this.height = outH;
		this.container.style.height = outH + "px";
		
		i = 0;
		this.forEachChart(function(chart) {
		    var meta = shifts[i++];
		    chart.draw();
			if ( meta && s.verticalShift.enabled && s.verticalShift.drawTicks ) {
				inst.drawTicks( meta.diff, meta.shift );
			}
		});
		
		//console.log(
		//	$(this.container).width(),
		//	$(this.container).height(),
		//	$(this.container).height() / $(this.container).width()
		//);
		
		return this;
	},
	
	/**
	 * Returns the biggest possible step interval for the vertical grid lines.
	 * @returns String  Can be "years", "months", "weeks", "days" or ""
	 */
	getVerticalGridIntervalType : function()
	{
		return this.canShowTimelineLabels( "years" )     ? "years"  :
			this.canShowTimelineLabels( "months" )       ? "months" : 
				this.canShowTimelineLabels( "weeks" )    ? "weeks"  : 
					this.canShowTimelineLabels( "days" ) ? "days"   : "";
	},
	
	// =========================================================================
	// Start of the selection-related methods
	// =========================================================================
	_init__selection : function() {
		var inst = this;
		
		// Re-select
		GC.Preferences.bind("set:metrics set:pctz", function() {
			setTimeout(function() { inst.restoreSelection(); }, 0);
		});
		
		$(this.container).on("click dblclick", function(e) {
			if (GC.chartSettings.primarySelectionEnabled) {
				GC.App.setSelectedAgemos(
					inst.x2weeks(e.pageX - $(this).offset().left) / GC.Constants.TIME_INTERVAL.WEEKS_IN_MONTH,
					"selected"
				);
			}
		});
		
		$("html").bind("appSelectionChange", function(e, selType, sel) {
			setTimeout(function() { inst.selectAge( sel.age.getWeeks(), selType ); }, 0);
		});
	},
	
	_init__hoverSelection : function() {
		var inst = this,
			
			/**
			 * Track the last hover-selection X coordinate. This is used to 
			 * filter and ignore the events with repeeted X coordinates.
			 */
			lastX,
			
			/**
			 * The hover selection is created after small delay that should 
			 * filter any flickering coused by quickly passing through the 
			 * points.
			 */
			hoverSelectionTimeout;
		
		$(this.container).on({
			"mouseover" : function(e) {
				if (!GC.chartSettings.secondarySelectionEnabled) {
					return true;
				}
				var id   = e.target.raphaelid,
					$tgt = $(e.target),
					elem = inst.paper.getById(id),
					x    = elem ? GC.Util.floatVal(elem.attrs.cx, -1) : -1,
					age;
				
				if ($tgt.is(".point") && x > -1) {
					if (x !== inst.lastHoverX) {
						inst.lastHoverX = x;
						age = inst.x2weeks(x);
						if (hoverSelectionTimeout) {
							window.clearTimeout(hoverSelectionTimeout);
						}
						hoverSelectionTimeout = setTimeout(function() {
							inst.selectAge(age, "hover");
							hoverSelectionTimeout = null;
						}, 200);
						return false;
					}
					return true;
				}
				
				// Ignore this too (this may happen when the selection has 
				// already been created at that point)
				if ($tgt.is(".tooltip-point") || 
					$tgt.is(".tooltip-node") || 
					$tgt.is(".hover-selection-line")) {
					return true;
				}
				
				// If the mouseover has happened over something else (other than
				// point or "pasive nodes") - clear the hover selection and exit
				if (elem || e.target === inst.paper.canvas) {
					inst.unsetSelection("hover");
					inst.lastHoverX = -1;
					if (hoverSelectionTimeout) {
						window.clearTimeout(hoverSelectionTimeout);
					}
				}
			}
		});
	},
	
	/**
	 * Clears the selection of the given type. The currently supportaed types 
	 * are:
	 *  "hover"    - when there are preview line and points selected
	 *  "selected" - The permanent selection changed only on click
	 * 
	 * @param {String} type Can be "hover" or "selected". When no argument is 
	 * provided (or it is falsy), then "selected" type is assumed.
	 */
	unsetSelection : function( type ) {
		
		type = type || "selected";
		
		// Always clear the hover line
		if (this.__CACHE__.hoverTimeSelectionAxis) {
			this.__CACHE__.hoverTimeSelectionAxis.attr("path", "");
		}
		
		// Clear the selection line
		if (type == "selected" && this.__CACHE__.timeSelectionAxis) {
			this.__CACHE__.timeSelectionAxis.attr("path", "");
		}
		
		this.forEachChart(function(chart) {
			chart.unsetSelection(type);
		});
		
		GC.Tooltip.reorder();
	},
	
	restoreSelection : function() {
		if (GC.SELECTION.selected.age > -1) {
			var ageWeeks = GC.SELECTION.selected.age.getWeeks();
			if (ageWeeks >= GC.App.getStartWeek() && 
				ageWeeks <= GC.App.getEndWeek() ) {
				this.selectAge(ageWeeks, "selected");
			}
		}
	},
	
	/**
	 * Lazy getter for the selection line 
	 */
	getTimeSelectionAxis : function() 
	{
		if (!this.__CACHE__.timeSelectionAxis) {
			this.__CACHE__.timeSelectionAxis = this.paper.path()
			.addClass("crispedges")
			.addClass("selection-line")
			.toFront();
		}
		return this.__CACHE__.timeSelectionAxis.attr(GC.chartSettings.selectionLine);
	},
	
	/**
	 * Lazy getter for the hover-selection line 
	 */
	getHoverTimeSelectionAxis : function() 
	{
		if (!this.__CACHE__.hoverTimeSelectionAxis) {
			this.__CACHE__.hoverTimeSelectionAxis = this.paper.path()
			.attr(GC.chartSettings.hoverSelectionLine)
			.addClass("crispedges")
			.addClass("hover-selection-line")
			.toFront();
		}
		return this.__CACHE__.hoverTimeSelectionAxis;
	},
	
	/**
	 * Draws the time selection line wherever the corresponding age in weeks is.
	 * In case there data points close to that time the line is moved to snap to
	 * the closest one and then the data points and tooltips are drawn too. 
	 * @param weeks
	 */
	selectAge : function( weeks, type )
	{
		// always clear the hover-selection
		this.unsetSelection("hover");
		
		if (type != "hover") {
			type = "selected";
		}
		
		if (type == "selected") {
			this.unsetSelection("selected");
		}
		
		var points  = this.drawSelectionPoints( weeks, type ),
			closest = null,
			agemos  = weeks2months( weeks ), 
			min     = GC.App.getStartWeek(),
			max     = GC.App.getEndWeek(),
			line    = type == "hover" ? 
				this.getHoverTimeSelectionAxis() :
				this.getTimeSelectionAxis(),
			inst    = this,
			old, cols, i, p = "", x;
		
		if (weeks > max || weeks < min) {
			return;
		}
		
		// Traverse to find the clisest point
		for ( i = 0; i < points.length; i++ ) {
			if (!closest || 
					Math.abs(points[i].data.agemos - agemos) < 
					Math.abs(closest.data.agemos - agemos)) {
				closest = points[i];
			}
		}
		
		// After (if) the closest point was found - re-calculate to find the 
		// new age and points, based on that
		if (closest/* && closest !== points[0]*/) {
			old = weeks;
			weeks = months2weeks(closest.data.agemos);
			if (weeks !== old) {
				//points = this.drawSelectionPoints( weeks, type );
				
				// Ignore re-selecting the same points
				if (weeks === GC.SELECTION.selected.age.getWeeks() ||
					(type == "hover" && 
					weeks === GC.SELECTION.hover.age.getWeeks())) {
					return;
				}
				
				// Update the selection age now
				//GC.App.setSelectedAgemos(
				//	weeks / GC.Constants.TIME_INTERVAL.WEEKS_IN_MONTH,
				//	type
				//);
				//GC.SELECTION[type].age.setWeeks(weeks);
			}
		}		
		
		cols = this.getColumnCount();
		
		for ( i = 0; i < cols; i++ ) {
			x = this.weeks2x( 
				weeks, 
				i 
			);
			p += " M " + x  + " 0 v " + this.height;
		}
		
		line.attr("path", p);
		
		if (!this._initialSelectionMade && 
			type == "selected" && 
			!points.length && 
			GC.SELECTION.selected.record && 
			GC.SELECTION.selected.record.annotation) 
		{
			this._initialSelectionMade = true;
			$('.annotation-button[data-agemos="' + 
				GC.Util.roundToPrecision(GC.SELECTION.selected.age / GC.Constants.TIME.MONTH, 1) + 
			'"]').trigger("click");
		}
		
		if (type == "selected") {
		    setTimeout(function() {
				inst.highlightAge(
					 GC.SELECTION.selected.age.getMilliseconds(), 
					 "active"
				);
			}, 0);
		}
	},
	
	/**
	 * Draws the points where the time selection line intersects the patient 
	 * data
	 * @param {Number} ageWeeks The selected age in weeks
	 * @param {String} type The type of the selection ("hover" or "selected")
	 *                      If omitted - "selected" type is ssumed.
	 * @returns {Array} Returns an array of Point objects, colected from all the 
	 *                  charts
	 */
	drawSelectionPoints : function(ageWeeks, type) 
	{
		var pts = [];
		this.forEachChart(function(chart) {
			pts = pts.concat(chart.drawSelectionPoints(ageWeeks, type));
		});
		return pts;
	},
	// =========================================================================
	// End of the selection-related methods
	// =========================================================================
	
	
	/**
	 * This is only used for debugging to visualize the chart positioning 
	 * algorithm. 
	 */
	drawTicks : function( diff, shift ) 
	{
		this.paper.path("M" + diff.points.join("L")).attr("stroke-opacity", 1);
		
		// Draw movement axis
		if (shift) {
			
			// Draw movement axis
			this.paper.path(
				" M " + diff.p1.x + " " + diff.p1.y + 
				" L " + diff.p2.x + " " + (diff.p2.y + shift)
			).attr({
				stroke : "green",
				"stroke-width" : 10,
				"stroke-linecap" : "round",
				"stroke-opacity" : 0.5
			});
			
			// movement sub-path
			this.paper.path(
				" M " + diff.p1.x + " " + (diff.p2.y + shift) + 
				" L " + diff.p2.x + " " + diff.p2.y
			).attr({
				stroke : "red",
				"stroke-width" : 10,
				"stroke-linecap" : "round",
				"stroke-opacity" : 0.5
			});
		} else {
			// Draw movement axis
			this.paper.path(
				" M " + diff.p1.x + " " + diff.p1.y + 
				" L " + diff.p2.x + " " + diff.p2.y
			).attr({
				stroke : "green",
				"stroke-width" : 10,
				"stroke-linecap" : "round",
				"stroke-opacity" : 0.5
			});
		}
		
		// Draw points
		var inst = this;
		$.each(diff.points, function(i, pt) {
			inst.paper.circle(pt[0], pt[1], 3);
		});
	},
	
	/**
	 * Draws the today's vertical line and it's label (but only if the todau's
	 * date happens to be inside the current time range)
	 */
	drawToday : function() 
	{
		var today     = new XDate(),
			label     = today.toString(GC.chartSettings.dateFormat),
			birth     = new XDate(GC.App.getPatient().birthdate),
			startWeek = GC.App.getStartWeek(),
			endWeek   = GC.App.getEndWeek(),
			diffWeeks = birth.diffWeeks(today),
			cols, i, x, y, txt, textBox;
		
		if ( diffWeeks >= startWeek && diffWeeks <= endWeek ) {
			cols = this.getColumnCount();
			for ( i = 0; i < cols; i++) {
				x = this.weeks2x(diffWeeks, i);
				y = this.topgutter - 10;
				
				// Dot 
				this.paper.circle(x, y, 3).attr(GC.chartSettings.todayDot);
				
				// Text
				txt = this.paper.text(x + 8, y, "TODAY " + label)
					.attr(GC.chartSettings.todayText);
				
				textBox = txt.getBBox();
				if (textBox.x2 > this.getColumnWidth(i) + this.getColumnLeft(i)) {
					txt.attr({
						x : x - 8,
						"text-anchor" : "end"
					});
				}
				
				this.paper.path("M" + x + "," + (y + 6) + "V" + this.height)
				.attr(GC.chartSettings.todayLine).addClass("crispedges");
			}
		}
	},
	
	drawAnnotations : function()
	{
		if ( GC.chartSettings.timeLogsEnabled ) {
			console.time( "drawAnnotations" );
		}
		
		var startAgeMos = GC.App.getStartAgeMos(),
			endAgeMos = GC.App.getEndAgeMos(),  
			annotated = $.grep(this.getAnnotations(), function( entry, i ) {
				return entry.agemos >= startAgeMos && entry.agemos <= endAgeMos;
			}),
			inst = this,
			topDiv, html;
		
		if (annotated.length) {
			topDiv = $(".annotations", this.container);
			if ( !topDiv.length ) {
				topDiv = $('<div class="annotations"/>').appendTo(this.container);
			} else {
				topDiv.empty();
			}
			
			html = [];
			this.forEachColumn(function( col, colIndex, colsLen ) {
				$.each(annotated, function(i, entry) {
					html.push(
						'<div class="annotation-button" style="left:',
						inst.months2x(entry.agemos, colIndex),
						'px" data-agemos="' + GC.Util.roundToPrecision(entry.agemos, 1) + '">',
						'<div class="details">',
							'<div class="header">',
								'<div class="title">Annotation</div>',
								new XDate(GC.App.getPatient().birthdate)
									.addMonths(entry.agemos)
									.toString(GC.chartSettings.dateFormat),
							'</div>',
							'<div class="content">',
								entry.annotation.txt,
							'</div>',
						'</div>',
						'</div>'
					);
				});
			});
			html = html.join("");
			topDiv.html( html );
			
			if ( GC.chartSettings.timeLogsEnabled ) {
				console.timeEnd( "drawAnnotations" );
			}
		}
	},
	
	/**
	 * Draws two almost equal timelines at the top and the bottom of the pane, 
	 * containing equally spreed labels. The only difference between them is the 
	 * vertical order. Note that this method may seem a bit redundant, but it 
	 * is highly optimized for faster execution...
	 */
	drawTimelines : function() {
		
		if ( GC.chartSettings.timeLogsEnabled ) {
			console.time( "Time for 'drawTimelines()'" );
		}
		
		// Cancel pending draws first!
		if ( this._drawTimelineDaysTimeout ) {
			clearTimeout( this._drawTimelineDaysTimeout );
		}
		if ( this._drawTimelineWeeksTimeout ) {
			clearTimeout( this._drawTimelineWeeksTimeout );
		}
		if ( this._drawTimelineMonthsTimeout ) {
			clearTimeout( this._drawTimelineMonthsTimeout );
		}
		if ( this._drawTimelineYearsTimeout ) {
			clearTimeout( this._drawTimelineYearsTimeout );
		}
		if ( this._drawTimelineGestWeeksTimeout ) {
			clearTimeout( this._drawTimelineGestWeeksTimeout );
		}
		
		var topTimeline    = $("#timeline-top", this.doc),
			bottomTimeline = $("#timeline-bottom", this.doc),
			$weeksTop      = topTimeline.find(".weeks", this.doc),
			$weeksBottom   = bottomTimeline.find(".weeks", this.doc),
			$monthsTop     = topTimeline.find(".months", this.doc),
			$monthsBottom  = bottomTimeline.find(".months", this.doc),
			$daysTop       = topTimeline.find(".days", this.doc),
			$daysBottom    = bottomTimeline.find(".days", this.doc),
			$yearsTop      = topTimeline.find(".years", this.doc),
			$yearsBottom   = bottomTimeline.find(".years", this.doc),
			$gestTop       = topTimeline.find(".gest", this.doc),
			$gestBottom    = bottomTimeline.find(".gest", this.doc),
			inst           = this,
			expextedTimelines = 0,
			expextedTimelineHeight = 0;
			
		function drawTags(topContainer, bottomContainer, getItemWidth, type, increment) {
			topContainer.empty();
			bottomContainer.empty();
			inst.forEachColumn(function( col, colIndex, colLength ) {
				var colWidth   = inst.getColumnWidth( colIndex ),
					colLeft    = inst.getColumnLeft( colIndex ), 
					itemWidth  = inst[getItemWidth]( colIndex ),
					html       = ['<div class="labels" ' 
						+ '" style="left:' + colLeft 
						+ 'px;width:' + (colWidth - GC.chartSettings.rightgutter) + 'px">'],
					points = inst.getIntervalPoints(type, colIndex),
					len = points.length,
					getMilliseconds = GC.SELECTION.selected.age.getMilliseconds();
				
				
				$.each(points, function(i, point) {
					var width = i === len - 1 ? 
						colWidth - (point.x + GC.chartSettings.leftgutter) : 
						(points[i+1].value - point.value) * itemWidth,
						isOverflowing = Math.round(point.x) >= Math.round(colWidth - GC.chartSettings.rightgutter - 2);
					if (Math.round(width) >= 1 && !isOverflowing) {
						html.push(
							'<div style="left:',
							point.x,
							'px;width:',
							width,
							'px;" data-value="' + point.value + '"' + 
							' startAge="' + point.raw[0] + '"' + 
							' endAge="' + point.raw[1] + '">',
							point.value,// + increment, 
							'</div>'
						);
					}
				});
				
				html.push('</div>');
				html = html.join("");
				topContainer.append(html);
				bottomContainer.append(html);
				
				if (--expextedTimelines <= 0 && getMilliseconds > -1) {
					setTimeout(function() {
						inst.highlightAge(getMilliseconds, "active");
					}, 0);
				}
			});
			topContainer.addClass("visible");
			bottomContainer.addClass("visible");
		}
		
		// Days ---------------------------------------------------------------
		if ( this.canShowTimelineLabels( "days" ) ) {
			expextedTimelines++;
			expextedTimelineHeight += 16;
			this._drawTimelineDaysTimeout = setTimeout(function() {
				drawTags($daysTop, $daysBottom, "pixelsPerDay", "days", 1);
			}, 0);
		} else {
			$daysTop.removeClass("visible");
			$daysBottom.removeClass("visible");
		}
		
		// Weeks ---------------------------------------------------------------
		if ( this.canShowTimelineLabels( "weeks" ) ) {
			expextedTimelines++;
			expextedTimelineHeight += 16;
			this._drawTimelineWeeksTimeout = setTimeout(function() {
				drawTags($weeksTop, $weeksBottom, "pixelsPerWeek", "weeks", 1);
			}, 0);
		} else {
			$weeksTop.removeClass("visible");
			$weeksBottom.removeClass("visible");
		}
		
		// Months --------------------------------------------------------------
		if ( this.canShowTimelineLabels( "months" ) ) {
			expextedTimelines++;
			expextedTimelineHeight += 16;
			this._drawTimelineMonthsTimeout = setTimeout(function() {
				drawTags($monthsTop, $monthsBottom, "pixelsPerMonth", "months", 0.5);
			}, 0);
		} else {
			$monthsTop.removeClass("visible");
			$monthsBottom.removeClass("visible");
		}
		
		// Years ---------------------------------------------------------------
		if ( this.canShowTimelineLabels( "years" ) ) {
			expextedTimelines++;
			expextedTimelineHeight += 16;
			this._drawTimelineYearsTimeout = setTimeout(function() {
				drawTags($yearsTop, $yearsBottom, "pixelsPerYear", "years", 1);
			}, 0);
		} else {
			$yearsTop.removeClass("visible");
			$yearsBottom.removeClass("visible");
		}
		
		// Gest Weeks ----------------------------------------------------------
		if ( this.canShowTimelineLabels("gestweeks") ) {
			expextedTimelines++;
			//expextedTimelineHeight += 16;
			this._drawTimelineGestWeeksTimeout = setTimeout(function() {
				drawTags($gestTop, $gestBottom, "pixelsPerWeek", "gestweeks", 1);
			}, 0);
			$("html", this.doc).addClass("has-gestweeks");
		} else {
			$("html", this.doc).removeClass("has-gestweeks");
			$gestTop.removeClass("visible");
			$gestBottom.removeClass("visible");
		}
		
		$("html", this.doc).toggleClass("multiple-timeline", expextedTimelineHeight > 16);
		topTimeline.toggleClass("multiple", expextedTimelineHeight > 16);
		bottomTimeline.toggleClass("multiple", expextedTimelineHeight > 16);
		
		//$("#stage").css({
		//	bottom : 16, //expextedTimelineHeight,
		//	marginTop : 16//expextedTimelineHeight
		//});
		
		if (expextedTimelineHeight > 16) {
			this.topgutter    = GC.chartSettings.topgutter    + expextedTimelineHeight - 16;
			this.bottomgutter = GC.chartSettings.bottomgutter + expextedTimelineHeight - 16;
		}
		
		//$(".annotations").css("top", expextedTimelineHeight - 16);
		
		if ( GC.chartSettings.timeLogsEnabled ) {
			console.timeEnd("Time for 'drawTimelines()'");
		}
	},
	
	/**
	 * Returns an array of "interval point" objects for this chart. Each point
	 * has two properties:
	 *      "x" {float}     - The X coordinate of the point relative to the 
	 *                        column at the given colIndex.
	 *      "value" {float} - The number like 12 for 12th month
	 * 
	 * - Only items within the current time range are returned.
	 * - The result is cached until the next redraw.
	 * - This method is specific to the ChartPane because the returned X 
	 *   coordinate is only valid vor it's width and leftgutter.
	 * @param {String} type One of "years", "months", "weeks" or "days"
	 * @param {Number} colIndex The index of the column for the points
	 * @return {Array}
	 */
	getIntervalPoints : function( type, colIndex )
	{
		if ( !this.__CACHE__.IntervalPoints ) {
			this.__CACHE__.IntervalPoints = {};
		}
		
		if ( !this.__CACHE__.IntervalPoints[type] ) {
			this.__CACHE__.IntervalPoints[type] = [];
		}
		
		if ( !this.__CACHE__.IntervalPoints[type][colIndex] ) {
			
			var p1      = GC.App.getStartWeek(), 
				p2      = GC.App.getEndWeek(), 
				patient = GC.App.getPatient(),
				cw      = this.getColumnWidth(colIndex) - GC.chartSettings.rightgutter,
				out     = [],
				n       = 0,
				step    = 1,
				x       = 0, 
				lastX   = 0,
				minStep = 40,
				px      = 0,
				q       = 1,
				i       = 0;
			
			switch ( type ) {
				case "years":
					p1 = p1 / GC.Constants.TIME_INTERVAL.WEEKS_IN_YEAR;
					p2 = p2 / GC.Constants.TIME_INTERVAL.WEEKS_IN_YEAR;
					px = this.pixelsPerYear( colIndex );
					q  = 1000 * 60 * 60 * 24 * 7 * GC.Constants.TIME_INTERVAL.WEEKS_IN_YEAR;
					break;
				case "months":
					p1   = p1 / GC.Constants.TIME_INTERVAL.WEEKS_IN_MONTH;
					p2   = p2 / GC.Constants.TIME_INTERVAL.WEEKS_IN_MONTH;
					px   = this.pixelsPerMonth( colIndex );// / 2;
					q  = 1000 * 60 * 60 * 24 * 7 * GC.Constants.TIME_INTERVAL.WEEKS_IN_MONTH;
					//step = 0.5;
					break;
				case "weeks":
					//p1 = Math.round(p1);
					//p2 = Math.round(p2);
					px = this.pixelsPerWeek( colIndex );
					q  = 1000 * 60 * 60 * 24 * 7;
					break;
				case "days":
					p1 = p1 * 7;//Math.round(p1 * 7);
					p2 = p2 * 7;//Math.round(p2 * 7);
					px = this.pixelsPerDay( colIndex );
					q  = 1000 * 60 * 60 * 24;
					break;
				case "gestweeks":
					minStep = 20;
					p1 += 40 + patient.EDD.diffWeeks(patient.DOB);
					p2 += 40 + patient.EDD.diffWeeks(patient.DOB);
					p2 = Math.min(p2, 51);
					px = this.pixelsPerWeek( colIndex );
					q  = 1000 * 60 * 60 * 24 * 7;
					break;
				default:
					throw "Invalid argument";
			}
			
			while ( p1 <= p2 && x < cw - minStep ) {
				x = GC.chartSettings.leftgutter + px * n++;
				if ( x - lastX >= minStep ) {
					lastX = x;
					
					// Set the end time of the last interval to the start of 
					// this one minus one ms
					if (i > 0) {
					    out[i - 1].raw[1] = p1 * q - 1;
					}
					
					out[i++] = {
						x     : x,
						value : Math.round(p1),
						raw   : [p1 * q]
					};
				}
				p1 += step;
			}
			
			// Set the end time of the last interval to the end time selected
			if (i > 0) {
                out[i - 1].raw[1] = p2 * q;
			}
			
			this.__CACHE__.IntervalPoints[type][colIndex] = out;
		}
		
		return this.__CACHE__.IntervalPoints[type][colIndex];
	},
	
	/**
	 * Returns the width of one day in pixels on this ChartPane. The result 
	 * depends on the chart width and the current time range.
	 * @return {Number}
	 */
	pixelsPerDay : function( colIndex ) 
	{
		if (!this.__CACHE__.pixelsPerDay) {
			this.__CACHE__.pixelsPerDay = [];
		}
		
		if (!this.__CACHE__.pixelsPerDay[ colIndex ]) {
            var w = this.getColumnWidth( colIndex, true ), 
                a = new XDate(GC.samplePatient.birthdate).addWeeks(GC.App.getStartWeek()),
                b = new XDate(GC.samplePatient.birthdate).addWeeks(GC.App.getEndWeek());
			this.__CACHE__.pixelsPerDay[ colIndex ] = w / a.diffDays(b);
		}
		
		return this.__CACHE__.pixelsPerDay[ colIndex ];
	},
	
	/**
	 * Returns the width of one week in pixels on this ChartPane. The result 
	 * depends on the chart width and the current time range.
	 * @return {Number}
	 */
	pixelsPerWeek : function( colIndex ) 
	{
		if (!this.__CACHE__.pixelsPerWeek) {
			this.__CACHE__.pixelsPerWeek = [];
		}
		
		if (!this.__CACHE__.pixelsPerWeek[ colIndex ]) {
			this.__CACHE__.pixelsPerWeek[ colIndex ] = this.pixelsPerDay( colIndex ) * 7;
		}
		
		return this.__CACHE__.pixelsPerWeek[ colIndex ];
	},
	
	/**
	 * Returns the width of one month in pixels on this ChartPane. The result 
	 * depends on the chart width and the current time range.
	 * IMPORTANT: These are NOT calendar months (no such thing as 28-31 days per 
	 * month). For the purpose of the timeline, EVERY month equals to year/12.
	 * @return {Number}
	 */
	pixelsPerMonth : function( colIndex ) 
	{
		if (!this.__CACHE__.pixelsPerMonth) {
			this.__CACHE__.pixelsPerMonth = [];
		}
		
		if (!this.__CACHE__.pixelsPerMonth[ colIndex ]) {
			this.__CACHE__.pixelsPerMonth[ colIndex ] = this.pixelsPerDay( colIndex ) * GC.Constants.TIME_INTERVAL.DAYS_IN_MONTH;
		}
		
		return this.__CACHE__.pixelsPerMonth[ colIndex ];
	},
	
	pixelsPerYear : function( colIndex )
	{
		if (!this.__CACHE__.pixelsPerYear) {
			this.__CACHE__.pixelsPerYear = [];
		}
		
		if (!this.__CACHE__.pixelsPerYear[ colIndex ]) {
			this.__CACHE__.pixelsPerYear[ colIndex ] = this.pixelsPerDay( colIndex ) * GC.Constants.TIME_INTERVAL.DAYS_IN_YEAR;
		}
		
		return this.__CACHE__.pixelsPerYear[ colIndex ];
	},
	
	x2months : function( x, colIndex ) 
	{
		if ( !colIndex && colIndex !== 0 ) {
			colIndex = this.getColIndexAtX( x );
			x -= this.getColumnLeft( colIndex );
		}
		
		x -= GC.chartSettings.leftgutter;
		x += GC.App.getStartWeek() * this.pixelsPerWeek( colIndex );
		
		return x / this.pixelsPerMonth( colIndex );
	},
	
	x2days : function( x, colIndex ) 
	{
		if ( !colIndex && colIndex !== 0 ) {
			colIndex = this.getColIndexAtX( x );
			x -= this.getColumnLeft( colIndex );
		}
		
		x -= GC.chartSettings.leftgutter;
		x += GC.App.getStartWeek() * this.pixelsPerWeek( colIndex );
		
		return x / this.pixelsPerDay( colIndex );
	},
	
	x2weeks : function( x, colIndex ) 
	{
		if ( !colIndex && colIndex !== 0 ) {
			colIndex = this.getColIndexAtX( x );
			x -= this.getColumnLeft( colIndex );
		}
		
		x -= GC.chartSettings.leftgutter;
		x += GC.App.getStartWeek() * this.pixelsPerWeek( colIndex );
		
		return x / this.pixelsPerWeek( colIndex );
	},
	
	months2x : function( m, colIndex ) 
	{
		m -= weeks2months(GC.App.getStartWeek());
		return this.getColumnLeft( colIndex ) + GC.chartSettings.leftgutter + m * this.pixelsPerMonth( colIndex ); 
	},
	
	weeks2x : function( w, colIndex ) 
	{
		w -= GC.App.getStartWeek();
		return this.getColumnLeft( colIndex ) + GC.chartSettings.leftgutter + w * this.pixelsPerWeek( colIndex );
	},
	
	days2x : function( d, colIndex ) 
	{
		d -= GC.App.getStartWeek() * 7;
		return this.getColumnLeft( colIndex ) + GC.chartSettings.leftgutter + d * this.pixelsPerDay( colIndex );
	},
	
	canShowTimelineLabels : function( type ) 
	{
		var time = GC.App.getWeeks() * GC.Constants.TIME.WEEK,
			patient;
		
		if (type == "gestweeks") {
			patient = GC.App.getPatient();
			return GC.App.getPatient().isPremature() && 
					time <= GC.Constants.TIME.YEAR * 2 + GC.Constants.TIME.WEEK
					//&& GC.App.getStartWeek() < 40 + patient.EDD.diffWeeks(patient.DOB);
		}
		
		if ( !GC.chartSettings.timeline.showLabelsInterval[type] ) {
			return false;
		}
		
		return time >  GC.chartSettings.timeline.showLabelsInterval[type].min &&
			   time <= GC.chartSettings.timeline.showLabelsInterval[type].max;
	},
	
	getAnnotations : function()
	{
		if ( !this.__CACHE__.annotations ) {
			var out = GC.App.getPatient().annotations.sort(function(a, b) {
				return a.agemos - b.agemos;
			});
			
			this.__CACHE__.annotations = out;
		}
		
		return this.__CACHE__.annotations;
	},
	
	getDataPointsAtMonth : function( m ) 
	{
		var out = [];
		this.forEachChart(function( chart ) {
			out = out.concat( chart.getDataPointsAtMonth( m ) );
		});
		return out;
	}
};

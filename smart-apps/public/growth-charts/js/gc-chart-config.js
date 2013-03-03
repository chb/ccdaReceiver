GC = window.GC || {};

(function () {
    "use strict";
	
	// Preferences: app + any patient +     user
	// Scratchpad : app +     patient + any user
	
	// =========================================================================
	// Scratchpad
	// =========================================================================
	var scratchpadData = {
		fileRevision : 2,
		medService : []
		
	};
	
	
	// =========================================================================
	// These settings are always loaded from here (doesn't matter if they has 
	// been stored on the server too) 
	// =========================================================================
	var readOnlySettings = {
		
		fileRevision : 59,
		
		// See the toString method for the rendering template
		version : {
			major    : 0,
			minor    : 3,
			build    : 3,
			revision : 6,
			state    : "alpha", // dev|alpha|beta|rc|r
			
			toString : function() {
				return  this.major    + "." + 
						this.minor    + "." + 
						this.build    + "." + 
						this.revision + "-" + 
						this.state;
			}
		},
		
		appEnvironment : "PRODUCTION", // DEVELOPMENT | PRODUCTION
		
		// Used to log the execution time of some important methods
		timeLogsEnabled : false,
		
		// Display coordinates on the paper
		mouseTrackingEnabled : false
		
	};
	
	// =========================================================================
	// These settings are just default (initial) values. They can be overriden 
	// by whatever is stored on the server as preferences
	// =========================================================================
	var settings = {
		
		defaultChart : "CDC", // 2+ years
		defaultBabyChart : "WHO", // 0 - 2 years
		defaultPrematureChart : "FENTON", // premature
		
		maxWidth : 1400, // For the charts paper
		minWidth : 1095, // For the entire page
		
		// The aspectRatio for the entire chart area "height / width".
		// Use "0" to disable ( make it stretch to the available height, if 
		// that height is enough for the charts to draw themselves)
		aspectRatio : 1 / 1.6,
		
		fontSize : 14,
		fontFamily: "'Helvetica Neue', Arial, Helvetica, sans-serif",
		
		initialView : "graphs", // graphs | table | parent
		
		// ref: http://arshaw.com/xdate/#Formatting
		dateFormat : "ddMMMyyyy",
		timeFormat : "h:mm TT",
		timeInterval : {
			"Years"   : "y", 
			"Year"    : "y", 
			"Months"  : "m", 
			"Month"   : "m", 
			"Weeks"   : "w", 
			"Week"    : "w", 
			"Days"    : "d",
			"Day"     : "d",
			"Hours"   : false,
			"Hour"    : false,
			"Minutes" : false,
			"Minute"  : false,
			"Seconds"     : false,
			"Second"      : false,
			"Milliseconds": false,
			"Millisecond" : false,
			separator : " ",
			fractions : false,
			zeroFill  : false,
			limit     : 2
		},
		
		// At what point chronologically does one start forecasting adult height?
		heightEstimatesMinAge : 12, // months
		
		percentiles : [0.05, 0.15, 0.5, 0.85, 0.95], // or [0.03, 0.15, 0.5, 0.85, 0.97]
		
		// Minimal time range to observe in millisecconds
		minTimeInterval : GC.Constants.TIME.WEEK * 6,
		
		pctz : "pct", // "pct" or "z"
		metrics : "metric", // "metric" or "eng"
		metricsPV : "eng", // Same as above, but for the parental view
		
		// Timeline Settings 
		// =====================================================================
		timeline : {
			snapDistance : 2, // % of the current column width
			
			// highlight on hover and select on click...
			interactive : false,
		
			// Show any of the following labels if the current time interval
			// fits into the corresponding values (in weeks)
			showLabelsInterval : {
				
				// days - zero to 13 weeks
				days : { 
					min : 0, 
					max : GC.Constants.TIME.MONTH * 3 
				}, 
				
				// weeks - two weeks to 6 months
				weeks: { 
					min : GC.Constants.TIME.WEEK * 2, 
					max : GC.Constants.TIME.YEAR * 2
				},
				
				// months - one month to 2 years
				months: { 
					min : GC.Constants.TIME.MONTH * 3, 
					max : GC.Constants.TIME.YEAR  * 3
				},
				
				// years - two years and up
				years: { 
					min : GC.Constants.TIME.YEAR * 2, 
					max : GC.Constants.TIME.YEAR * 150
				}
			}
		},
		
		roundPrecision : {
			length     : { std : 2, nicu : 2 },
			weight     : { std : 2, nicu : 2 },
			headc      : { std : 2, nicu : 2 },
			bmi        : { std : 2, nicu : 2 },
			percent    : { std : 0, nicu : 1 },
			percentile : { std : 0, nicu : 2 },
			zscore     : { std : 2, nicu : 2 },
			velocity   : { std : "yearly", nicu : "daily" }
		},
		
        // margins to be left around the main grid (for labels etc)
        leftgutter  : 48, 
        rightgutter : 48,
        bottomgutter: 20,
        topgutter   : 25,
		chartSpaceY : 40,
		
		// Column resizing
		columnResizing : {
		    "enabled"  : false,
		    "minWidth" : 0.25, // 25%
		    "maxWidth" : 0.75  // 75%
        },
    
        gridLineX: { 
			"stroke"           : "#000", 
			"stroke-width"     : 1, 
			"stroke-dasharray" : "- ", 
			"stroke-opacity"   : 0.6 
        },
        
		gridLineY: { 
			"stroke"        : "#EEE",
			"stroke-width"  : 1,
			"stroke-opacity": 1
		},
        
        selectionLine : {
			"stroke-width"   : 1,
			"stroke-opacity" : 1,
			"stroke"         : "#38434C"
        },
        
        hoverSelectionLine : {
			"stroke-width"   : 1,
			"stroke-opacity" : 0.3,
			"stroke"         : "#61737F"
        },
        
        todayLine : {
			"stroke-width" : 1,
			"stroke"       : "#AAA"
        },
        
        todayDot : { 
			"fill"   : "#AAA", 
			"stroke" : "none" 
		},
		
		todayText : { 
			"fill"        : "#AAA", 
			"stroke"      : "none",
			"text-anchor" : "start",
			"font-weight" : "bold" 
		},
        
        // Styling definitions for the graph and labels
        txtLabel: {font: '10px Helvetica, Arial', fill: "#000"},  // Axis labels styling
        txtTitle: {font: '16px Helvetica, Arial', fill: "#000"},  // Title label styling
        
		chartLabels : {
			attr : {
				"font-family" : "sans-serif, Verdana, Arial",
				"font-size"   : 20,
				"font-weight" : "normal",
				"text-anchor" : "end",
				"stroke"      : "none"
			}
		},
		
		higlightTimelineRanges : false,
		pointDoubleClickEdit : false,
		primarySelectionEnabled: true,
		secondarySelectionEnabled: true,
		
		colorPrresets : {
			"Default" : {
				"Length" : "#25B3DF",
				"Weight" : "#EC9A16",
				"Head C" : "#87BD28",
				"BMI"    : "#B26666",
				"Primary selection"   : "#38434C",
				"Secondary selection" : "#61737F"
			},
			"Greyscale" : {
				"Length" : "#888",
				"Weight" : "#888",
				"Head C" : "#888",
				"BMI"    : "#888",
				"Primary selection"   : "#333",
				"Secondary selection" : "#999"
			}
		},
		
		currentColorPreset : "Default", // One of the listed above
		saturation : 0, // -0.5 to +0.5 correction
		brightness : 0, // -0.5 to +0.5 correction
		
		// Charts
		// =====================================================================
		drawChartBackground : false,
		drawChartOutlines   : false,
		verticalShift : {
			enabled   : true,
			ticks     : 30,
			drawTicks : false
		},
		
		chartBackground : {
			"fill"        : "#EEC",
			"fill-opacity": 0.5,
			"stroke"      : "none"
		},
		
		weightChart : {
			abbr : "W",
			shortName : "WEIGHT",
			color : "#EC9A16", // general use clear color
			lines : {
				stroke           : "#9F874C", 
				"stroke-width"   : 1, 
				"stroke-linejoin": "round"
			},
			axis : {
				stroke           : "#D9AD3C", 
				"stroke-width"   : 1,
				"shape-rendering": "crispedges"
			},
			axisLabels : {
				"fill"      : "#A67308", 
				"font-size" : 12
			},
			pointsColor : "#A67308",
			fillRegion : {
				fill           : "#EC9A16",
				"fill-opacity" : 0.7,
				"stroke-width" : 0
			},
			problemRegion : {
				fillOpacity : 0.3,
				fillURL     : "url(img/problem-pattern-orange.png)",
				fillColor   : "#F7B953",
				stroke      : "none"
			}
		},
		
		lengthChart : {
			abbr : "L",
			shortName : "LENGTH",
			color : "#25B3DF", // general use clear color
			lines : {
				stroke           : "#467EAA", 
				"stroke-width"   : 1, 
				"stroke-linejoin": "round",
				"stroke-opacity" : 0.8 
			},
			axis : {
				stroke           : "#467EAA", 
				"stroke-width"   : 1,
				"shape-rendering": "crispedges"
			},
			axisLabels : {
				"fill"      : "#114477",
				"font-size" : 12
			},
			pointsColor : "#114477",
			fillRegion : {
				fill           : "#25B3DF",
				"fill-opacity" : 0.5,
				"stroke-width" : 0
			},
			problemRegion : {
				fillOpacity : 0.3,
				fillColor   : "#2693FF",
				fillURL     : "url(img/problem-pattern-blue.png)",
				stroke      : "none"
			}
		},
		
		headChart : {
			abbr : "HC",
			shortName : "HEAD C",
			color : "#87BD28", // general use clear color
			lines : {
				stroke           : "#629E50", 
				"stroke-width"   : 1, 
				"stroke-linejoin": "round"
			},
			axis : {
				stroke           : "#629E50", 
				"stroke-width"   : 1,
				"shape-rendering": "crispedges"
			},
			axisLabels : {
				"fill"      : "#648A59", 
				"font-size" : 12
			},
			pointsColor : "#629E50",
			fillRegion : {
				fill           : "#87BD28",
				"fill-opacity" : 0.7,
				"stroke-width" : 0
			},
			problemRegion : {
				fillOpacity : 0.3,
				fillColor   : "#B5D58E",
				fillURL     : "url(img/problem-pattern-green.png)",
				stroke      : "none"
			}
		},
		
		bodyMassChart : {
			abbr : "BMI",
			shortName : "BMI",
			color : "#B26666", // general use clear color
			lines : {
				stroke           : "#B20000", 
				"stroke-width"   : 1, 
				"stroke-linejoin": "round"
			},
			axis : {
				stroke           : "#B20000", 
				"stroke-width"   : 1,
				"shape-rendering": "crispedges"
			},
			axisLabels : {
				"fill"      : "#B20000", 
				"font-size" : 12
			},
			pointsColor : "#B20000",
			fillRegion : {
				fill           : "#FA9",
				"fill-opacity" : 0.75,
				"stroke-width" : 0
			},
			problemRegion : {
				fillOpacity : 0.3,
				fillColor   : "#D93600",
				fillURL     : "url(img/problem-pattern-orange.png)",
				stroke      : "none"
			}
		},
		
		patientData : {
			points : {
				even : {
					stroke          : "#FFF", 
					"stroke-width"  : 4,
					"stroke-opacity": 0.9,
					"fill-opacity"  : 1
				},
				odd : {
					stroke          : "#FFF", 
					"stroke-width"  : 4,
					"stroke-opacity": 0.9,
					"fill-opacity"  : 1
				},
				firstMonth : {
					stroke          : "#FFF", 
					"stroke-width"  : 8,
					"stroke-opacity": 0.8,
					"fill-opacity"  : 1
				},
				current : {
					stroke: "rgb(0,0,0)", 
					"stroke-width": 2
				}
			},
			lines : {
				"stroke-width": 1.5
			}
		},
		
		// The pail grey rectangle on the inner side of the right axis
		rightAxisInnerShadow : {
			width : 20,
			attr  : {
				"stroke-width" : 0,
				"fill"         : "#E0E0E0",
				"fill-opacity" : 1
			}
		},
		
		// selectionRect
		selectionRect : {
			"fill"             : "#039",
			"fill-opacity"     : 0.2,
			"stroke"           : "#006",
			"stroke-width"     : 1,
			"stroke-opacity"   : 0.5,
			"stroke-dasharray" : "- "
		}
    };
	
	GC.chartSettings  = $.extend(true, {}, settings, readOnlySettings);
	GC.scratchpadData = $.extend(true, {}, scratchpadData);
	
	GC.__INITIAL__chartSettings = $.extend(true, {}, GC.chartSettings);
	
	// GC.Preferences
	// =========================================================================
	GC.Preferences = new GC.Model(
		GC.chartSettings, 
		readOnlySettings
	);
	
	// GC.Scratchpad
	// =========================================================================
	GC.Scratchpad  = new GC.Model(
		GC.scratchpadData
	);
	GC.Scratchpad.autoCommit = true;
	
}());

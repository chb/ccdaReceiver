/*global Chart, GC, PointSet, strPad, weeks2months, Raphael, findMinMax, getYatX*/
/*jslint eqeq: true, nomen: true, plusplus: true, devel: true */
(function(NS, $) {
	
	"use strict";
	
	var NAME = "Length/Stature Chart";
	
	function LengthChart() {
		this.settings = GC.chartSettings.lengthChart;
		this.heightEstimateTooltips = [];
	}
	
	LengthChart.prototype = new Chart();
	
	$.extend(LengthChart.prototype, {
		
		title : NAME,
		
		patientDataType : "lengthAndStature",
		
		/**
		 * In addition to the standart chart initialization, this one should 
		 * listen to changes in PATIENT.midParentalHeight and redraw the height 
		 * estimate if needed.
		 */
		init : function( pane ) 
		{
			Chart.prototype.init.call( this, pane );
			
			this.heightEstimateSet = pane.paper.set();
			
			var inst = this;
			$("html").bind("set:midParentalHeight." + this.ID, function(e, val) {
				if ( inst.isVisible() ) {
					if (inst.__CACHE__.midParentalHeight !== undefined) {
						delete inst.__CACHE__.midParentalHeight;
					}
					inst.drawHeightEstimates();
				}
			});
		},
		
		/**
		 * Extends the base method to also clear the height estimation related 
		 * element
		 */ 
		clear : function() 
		{
			Chart.prototype.clear.call( this );
			this.heightEstimateSet.remove();
			return this;
		},
		
		getUnits : function()
		{
			var metrics = GC.App.getMetrics(),
				out = this.dataSet ? GC.DATA_SETS[this.dataSet].units : "cm";
			
			if ( out == "cm" && metrics == "eng" ) {
				out = "in";
			}
			else if ( out == "in" &&  metrics == "met" ) {
				out = "cm";
			}
			
			return out;
		},
	
		getTitle : function() {
			var ageFrom = GC.App.getStartAgeMos(),
				ageTo   = GC.App.getEndAgeMos(),
				title   = "";
			
			if ( ageTo > 36 && ageFrom < 36 ) {
				title = GC.str("STR_4"); // Length/Stature
			}
			else if ( ageTo <= 36 ) {
				title = GC.str("STR_2"); // Length
			}
			else if ( ageFrom >= 36 ) {
				title = GC.str("STR_3"); // Stature
			}
			
			if ( title ) {
				title += " (" + this.getUnits() + ")";
			}
			
			return title;
		},

		setDataSource : function( src ) 
		{
			return this._setDataSource( "primary", src, "LENGTH" );
		},

		setProblem : function( src ) 
		{
			return this._setDataSource( "secondary", src, "LENGTH" );
		},
		
		_getLastAgeMos : function( data ) 
		{
			var type = Object.prototype.toString.call(data),
				arr  = [],
				x;
			
			if ( type == "[object Array]" ) {
				return findMinMax(data, "Agemos").max;
			}
			
			if ( type == "[object Object]" ) {
				for ( x in data ) {
					if ( data.hasOwnProperty(x) ) {
						arr.push(findMinMax(data[x], "Agemos").max);
					}
				}
				return arr.sort(function(a, b) { return a - b; })[0];
			}
			return 0;
		},
		
		_get_midParentalHeight : function() 
		{
		    if ( !this.dataSet ) { 
				return null;
			}
			
			var patient = GC.App.getPatient();
			
			if ( !patient.midParentalHeight ) {
				return null;
			}
			
			var lastHeightEntry = patient.getLastModelEntry(function( entry ) {
				return entry.hasOwnProperty("lengthAndStature");
			});
			
			if ( !lastHeightEntry || lastHeightEntry.agemos < GC.chartSettings.heightEstimatesMinAge ) {
				return null;
			}
			
			var dataSet    = GC.DATA_SETS[ this.dataSet ],
				gender     = GC.App.getGender(),
				data       = dataSet.data[gender],
				lastAgeMos = this._getLastAgeMos(data);
			
			if ( lastAgeMos < 240 ) {
				return null;
			}
			
			var pctLast = GC.findPercentileFromX(
				patient.midParentalHeight, 
				dataSet, 
				gender, 
				lastAgeMos
			);
			
			var nom = GC.findXFromPercentile(
				pctLast, 
				dataSet, 
				gender, 
				GC.App.getEndAgeMos()
			);
			
			return {
				height     : nom,
				percentile : pctLast,
				title      : GC.str("STR_32") // Mid. Parental Height
			};
		},
		
		_get_nominalHeight : function() 
		{
			if ( !this.dataSet ) {
				return null;
			}
			
			var lastHeightEntry = GC.App.getPatient().getLastModelEntry(function( entry ) {
				return entry.hasOwnProperty("lengthAndStature");
			});
			
			if ( !lastHeightEntry || lastHeightEntry.agemos < GC.chartSettings.heightEstimatesMinAge ) {
				return null;
			}
			
			var dataSet    = GC.DATA_SETS[ this.dataSet ];
			var gender     = GC.App.getGender();
			var data       = dataSet.data[gender];
			var lastAgeMos = this._getLastAgeMos(data);//data[data.length - 1].Agemos;
			
			if ( lastAgeMos < lastHeightEntry.agemos ) {
				return null;
			}
			
			var pctLast = GC.findPercentileFromX(
				lastHeightEntry.lengthAndStature, 
				dataSet, 
				gender, 
				lastHeightEntry.agemos
			);
			
			var nom = GC.findXFromPercentile(
				pctLast, 
				dataSet, 
				gender, 
				GC.App.getEndAgeMos()
			);
			
			return {
				height     : nom,
				percentile : pctLast,
				title      : GC.str("STR_33") // Nominal Height
			};
		},
		
		_get_nominalBoneAge : function() 
		{
			if ( !this.dataSet ) { 
				return null;
			}
			
			// Get the last BoneAge entry from all the data
			var lastBoneAgeEntry = GC.App.getPatient().getLastModelEntry(function( entry ) {
				return entry.hasOwnProperty("boneAge");
			});
			
			if ( !lastBoneAgeEntry || lastBoneAgeEntry.agemos < GC.chartSettings.heightEstimatesMinAge ) {
				return;
			}
			
			var patient = GC.App.getPatient();
			
			// The bone age corresponds to the X axis so fist we need to find Y 
			// (height/stature) from it
			var height     = lastBoneAgeEntry.lengthAndStature;
			var age        = lastBoneAgeEntry.agemos;
			
			if ( height === undefined ) {
				var prevEntry = patient.getPrevModelEntry(lastBoneAgeEntry.agemos, function(entry) {
					return entry.hasOwnProperty("lengthAndStature");
				});
				
				var nextEntry = patient.getNextModelEntry(lastBoneAgeEntry.agemos, function(entry) {
					return entry.hasOwnProperty("lengthAndStature");
				});
				
				if ( !prevEntry || !nextEntry ) {
					return;
				}
				
				var h1 = prevEntry.lengthAndStature,
					h2 = nextEntry.lengthAndStature,
					x1 = prevEntry.agemos,
					x2 = nextEntry.agemos;
					
				height = h1 + (h2 - h1) / (x2 - x1);
				age    = x1 + (x2 - x1) / (h2 - h1);
			}
			
			var dataSet    = GC.DATA_SETS[ this.dataSet ];
			var gender     = GC.App.getGender();
			var data       = dataSet.data[gender];
			var lastAgeMos = this._getLastAgeMos(data);//data[data.length - 1].Agemos;
			
			if ( lastAgeMos < lastBoneAgeEntry.agemos ) {
				return null;
			}
			
			var pctLast = GC.findPercentileFromX(
				height, 
				dataSet, 
				gender, 
				age
			);
			
			var nom = GC.findXFromPercentile(
				pctLast, 
				dataSet, 
				gender, 
				GC.App.getEndAgeMos()
			);
			
			return {
				height     : nom,
				percentile : pctLast,
				title      : GC.str("STR_34") // Estimated Bone Age Height
			};
		},
		
		draw : function() 
		{
			if ( !this.isVisible() ) {
				return;
			}
			
			Chart.prototype.draw.call(this);
			this.drawBoneAge();
			this.drawHeightEstimates();
		},
		
		drawBoneAge : function() 
		{
			var boneAgeData = GC.App.getPatient().boneAge,
				points      = this.getPatientDataPoints(),
				len         = boneAgeData.length;
				
			if ( len && points ) {
				var startAge = GC.App.getStartAgeMos(),
					endAge   = GC.App.getEndAgeMos(),
					entry, i, x1, x2, x, y1, y2, y;
				
				points = points._data;
				
				for ( i = 0; i < len; i++ ) {
					entry = boneAgeData[i];
					if ( entry.agemos >= startAge && entry.agemos <= endAge ) {
						
						var prev = null, next = null;
						$.each(points, function(j, point) {
							
							if ( point.agemos === entry.agemos ) {
								prev = next = point;
								return false;
							}
							
							if ( point.agemos <= entry.agemos ) {
								if ( !prev || prev.agemos < point.agemos ) {
									prev = point;
								}
							}
							
							if ( point.agemos >= entry.agemos ) {
								if ( !next || next.agemos > point.agemos ) {
									next = point;
								}
							}
							
						});
						
						if ( prev && next ) {
							x1 = prev.agemos;
							x2 = next.agemos;
							y1 = prev.value;
							y2 = next.value;
							x  = this._scaleX(entry.agemos);
							y  = this._scaleY(getYatX(entry.agemos, x1, y1, x2, y2));
							this._nodes.push(this.pane.paper.circle(x, y, 3).attr({ 
								"stroke" : GC.Util.darken(this.settings.lines.stroke, 0.3),
								"fill"   : this.settings.lines.stroke
							}).toBack());
							
							x2 = this._scaleX(entry.boneAge);
							
							var crop = false;
							if ( x2 < this.x ) {
								x2 = this.x;
								crop = true;
							}
							else if ( x2 > this.x + this.width ) {
								x2 = this.x + this.width;
								crop = true;
							}
							
							// The dashed line
							this._nodes.push(this.pane.paper.path(
								"M" + x + "," + y + "H" + x2
							).attr({ 
								"stroke-width" : 1,
								"stroke" : GC.Util.darken(this.settings.lines.stroke, 0.3),
								"stroke-dasharray" : "- "
							}));
							
							// The "X"
							if ( !crop ) {
								this._nodes.push(this.pane.paper.path(
									"M" + (x2 - 3) + "," + (y - 3) + 
									"L" + (x2 + 3) + "," + (y + 3) + 
									"M" + (x2 - 3) + "," + (y + 3) + 
									"L" + (x2 + 3) + "," + (y - 3) 
								).attr({ 
									"stroke-width" : 2,
									"stroke" : GC.Util.darken(this.settings.lines.stroke, 0.4)
								}));
							}
						}
					}
				}
			}
		},
		
		drawHeightEstimates : function() 
		{
		    
			$.each(this.heightEstimateTooltips, function(i, t) {
				t.remove();
			});
			
			this.heightEstimateTooltips = [];
			this.heightEstimateSet.remove();
			
			var all            = [],
				inst           = this,
				estMidParental = inst.get("midParentalHeight"),
				estPercentile  = inst.get("nominalHeight"),
				estBoneAge     = inst.get("nominalBoneAge"),
				axis, midY, set;
			
			if ( estMidParental ) {
				all.push( estMidParental );
			}
			if ( estPercentile ) { 
				all.push( estPercentile );
			}
			if ( estBoneAge ) {
				all.push( estBoneAge );
			}
			
			if ( !all.length ) {
				return;
			}
			
			all.sort(function(a, b) {
				return b.height - a.height;
			});
			
			axis = this.get("axisCoordinates"); 
			midY = axis.pB.y + ( axis.pC.y - axis.pB.y ) / 2;
			set  = inst.pane.paper.set();
			
			set.tooltips = [];
				
			$.each(all, function(i, o) {
				
				var y = inst._scaleY(o.height),
					x,yAdjusted,color,txtColor,setId,txt, ttSettings, dot;
				
				if (isNaN(y)) {
					return true; // continue each
				}
				
				x         = inst.x + inst.width;
				yAdjusted = (midY - all.length * 10) + i * 20;
				color     = GC.Util.brighten(inst.settings.axis.stroke, i / all.length);
				txtColor  = GC.Util.readableColor( color, 0.7, 0.8 );
				setId     = Raphael.createUUID();
				
				// The line 
				set.push(inst.pane.paper.path(
					"M" + (x + 2) + "," + y +
					"h4" + 
					"L" + (x + 27) + "," + yAdjusted +
					"h4"
				).attr({
					"stroke" : inst.settings.axis.stroke,
					"stroke-opacity" : 0.6
				}).toBack());
				
				// The big circle
				dot = inst.pane.paper.circle(
					x + 36,
					yAdjusted,
					5
				).attr({
					"fill"   : color,
					"stroke" : inst.settings.axis.stroke
				});
				set.push(dot);
				
				// The small circle
				set.push(inst.pane.paper.circle(
					x,
					y,
					2
				).attr({
					"fill"   : "#FFF",
					"stroke" : inst.settings.axis.stroke
				}));
				
				txt = o.title + "\n";
				
				txt += GC.App.getMetrics() == "eng" ? 
					GC.Util.cmToUS(o.height) :
					GC.Util.roundToPrecision(o.height, 1) + "cm";
				
				txt += GC.App.getPCTZ() == "pct" ? 
					" (" + GC.Util.round(o.percentile * 100) + "%)" :
					" (" + GC.Util.round(Math.normsinv(o.percentile)) + "Z)";
				
				ttSettings = {
					text : txt,
					x    : x + 36,
					y    : yAdjusted,
					id   : setId,
					pointOffset : 6,
					bg : color,
					color: txtColor,
					shiftY : -70,
					shadowOffsetX : -15,
					shadowOffsetY : 5
				};
				
				set.tooltips.push(ttSettings);
				
				inst.heightEstimateTooltips.push(GC.tooltip(inst.pane.paper, ttSettings).hide());
				
				//inst._nodes.push(set);
				inst.heightEstimateSet = set;
			});
			
			set.hover(
				function() { 
					set.attr("stroke", "#000"); 
					$.each(inst.heightEstimateTooltips, function(i, t) {
						if (!t.nodes.length) {
							t = new GC.tooltip(inst.pane.paper, t.cfg);
							inst.heightEstimateTooltips[i] = t;
						}
						t.show().toFront();
					});
				},
				function() { 
					set.attr("stroke", inst.settings.axis.stroke); 
					$.each(inst.heightEstimateTooltips, function(i, t) {
						t.hide();
					});
				}
			);
		},
		
		_get_dataPoints : function()
		{
			return Chart.prototype._get_dataPoints.call( this, "lengthAndStature" );
		}
	});
	
	NS.App.Charts[NAME] = LengthChart;
	
}(GC, jQuery));


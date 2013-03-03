/*global Chart, GC, PointSet, strPad, weeks2months, Raphael*/
/*jslint eqeq: true, nomen: true, plusplus: true */
(function(NS, $) {
	
	"use strict";
	
	var NAME = "Head Circumference Chart";
	
	function HeadChart() 
	{
		this.settings = GC.chartSettings.headChart;
	}
	 
	HeadChart.prototype = new Chart();

	$.extend(HeadChart.prototype, {
		
		title : NAME,
		
		patientDataType : "headc",
		
		getUnits : function() {
			return GC.App.getMetrics() == "eng" ? "in" : "cm";
		},
		
		getTitle : function() {
			return GC.str("STR_1") + " (" + this.getUnits() + ")";
		},

		setDataSource : function( src ) {
			return this._setDataSource( "primary", src, "HEADC" );
		},

		setProblem : function( src ) {
			return this._setDataSource( "secondary", src, "HEADC" );
		},
		
		_get_dataPoints : function() {
			return Chart.prototype._get_dataPoints.call( this, "headc" );
		},
		
		getTooltipLabel : function( val ) {
			if ( GC.App.getMetrics() == "eng" ) {
				return GC.Util.round( 
					val * GC.Constants.METRICS.INCHES_IN_CENTIMETER 
				) + " in";
			}
			return GC.Util.round( val ) + " cm";
		}
	
	});
	
	NS.App.Charts[NAME] = HeadChart;
	
}(GC, jQuery));
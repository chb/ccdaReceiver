(function() {
	
	var drawn, 
		leftPane, 
		parentalDarwn,
		PATIENT = opener.GC.currentPatient;
	
	debugLog = console ? console.log : $.noop;
	
	$.extend(true, GC.chartSettings, opener.GC.chartSettings);
	GC.translateFentonDatasets(PATIENT);
	
	GC.App = {
		DEBUG_MODE : false,
		Charts : [],
		selectRangeForAge : function() {},
		fitToData : function() {},
		getFitRange : function() {}
	};
	
	$.each([
		"getPatient",
		"getViewType",
		"getGender",
		"getStartWeek",
		"getEndWeek",
		"getWeeks",
		"getStartAgeMos",
		"getEndAgeMos",
		"getPrimaryChartType",
		"getCorrectionalChartType",
		"getPCTZ",
		"getMetrics",
		"getShowPretermArrows",
		"getLanguage",
		"getGestCorrectionDuration",
		"getGestCorrectionType",
		"getCorrectionAge"
	], function(i, name) {
		GC.App[name] = function() {
			return opener.GC.App[name]();
		};
	});
	
	(function() {
		
		GC.SELECTION = {
			hover    : { age : new GC.Time(-1), record : null },
			selected : { age : new GC.Time(-1), record : null }
		};
	
		function set(rec, mos, type) {
			GC.SELECTION[type].age.setMonths(mos);
			GC.SELECTION[type].record = rec;
			//GC.App.selectRangeForAge(GC.SELECTION[type].age.getMilliseconds());
			$("html").trigger("appSelectionChange", [type, GC.SELECTION[type]]);
		}
		
		GC.App.setSelectedAgemos = function(agemos, type) {
			
			if (type != "hover") {
				type = "selected";
			}
			
			if (GC.SELECTION[type].age.getMonths() === agemos) {
				return;
			}
			
			var rec = PATIENT.geModelEntryAtAgemos(agemos);
			set(rec, rec ? rec.agemos : agemos, type);
		};
		
		GC.App.setSelectedRecord = function(record, type) {
			
			if (type != "hover") {
				type = "selected";
			}
			
			if (GC.SELECTION[type].record === record) {
				return;
			}
			
			set(record, record.agemos, type);
		};
		
		GC.App.unsetSelection = function(type) {
			if (type != "hover") {
				type = "selected";
			}
			
			if (GC.SELECTION[type].age.getMilliseconds() < 0) {
				return;
			}
			
			set(null, -1, type);
		};
	
	}());
	
	function setStageHeight() {
		var top = 0, 
			marginTop = 0,
			bottom = 0, 
			header = $("#header:visible"),
			timelineTop = $("#timeline-top:visible"),
			timelineBottom = $("#timeline-bottom:visible");
		
		if (header.length) {
			top += header.outerHeight();
		}
		
		if (timelineTop.length) {
			marginTop += timelineTop.outerHeight();
		}
		
		if (timelineBottom.length) {
			bottom += timelineBottom.outerHeight();
		}
		
		$("#stage").css({
			top : top,
			height: $(window).height() - bottom - top - marginTop
			//marginTop : marginTop,
			//bottom : bottom
		});
	}
	
	function draw(type) {
		type = type || GC.App.getViewType();
		
		$("#view-clinical")[type == "graphs" ? "show" : "hide"]();
		$("#view-parental")[type == "parent" ? "show" : "hide"]();
		$("#view-table"   )[type == "table"  ? "show" : "hide"]();
		
		$("html")
		.toggleClass("view-clinical", type == "graphs" || type == "table")
		.toggleClass("view-parental", type == "parent")
		.toggleClass("view-charts"  , type == "graphs")
		.toggleClass("view-table"   , type == "table" );
		
		switch (type) {
			case "graphs":
				firstRender = !leftPane;
				if ( firstRender ) {
					leftPane = new ChartPane(Raphael($("#stage .stage-1")[0]));
					leftPane
						.addChart( new GC.App.Charts["Length/Stature Chart"](), 0 )
						.addChart( new GC.App.Charts["Weight Chart"]()        , 0 )
						.addChart( new GC.App.Charts["Percentile Chart"]()    , 1 )
						.addChart( new GC.App.Charts["Chart Stack"]([ 
							new GC.App.Charts["Body Mass Index Chart"](), 
							new GC.App.Charts["Head Circumference Chart"]() 
						]), 1);
					GC.App.Pane = leftPane;
					GC.App.ChartsView = leftPane;
				}
				
				leftPane.draw();
				break;
		
			case "parent":
				if (!parentalDarwn) {
					drawPaper(600, 320, 0, 0, PATIENT);
					parentalDarwn = true;
				}
				break;
			
			case "table":
				GC.TableView.render();
				break;
		}
		
		drawn = true;
	}
	
	
	$(function() {
		
		
		$("#header").html(
			'<h1>' + PATIENT.name + '</h1>'
		);
		
		setStageHeight();
		draw();
		
		var timer = 0, 
			lastWidth = null, 
			lastHeight = null;
		
		$(window).bind("resize.redrawSVG", function() {
			if ( timer ) {
				clearTimeout( timer );
			}
			
			setStageHeight();
			
			timer = setTimeout(function() {
				var w = $(window).width(),
					h = $(window).height();
				if (w !== lastWidth || h !== lastHeight) {
					lastWidth = w;
					lastHeight = h;
					if ( leftPane ) {
						leftPane.draw();
					}
				}
			}, 100);
		});
		
	});
	
})();
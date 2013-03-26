$(function() {
	if (!window.opener) {
		return;
	}
	
	GC = opener.GC;
	ChartPane = opener.ChartPane;
	Chart = opener.Chart;
	
	var PATIENT = GC.currentPatient,
		drawn,
		leftPane;

	function draw(type) {
		if (!drawn) {
			var lastEntry = PATIENT.getLastModelEntry();
			if (lastEntry) {
				GC.App.selectRangeForAge(lastEntry.agemos * GC.Constants.TIME.MONTH);
				GC.App.setSelectedRecord(lastEntry);
			}
		}
		
		switch (type || GC.App.getViewType()) {
			case "graphs":
				firstRender = !leftPane;
				if ( firstRender ) {
					leftPane = new ChartPane(Raphael($("#stage .stage-1")[0]));
					leftPane.addChart( new GC.App.Charts["Length/Stature Chart"](), 0 );
					leftPane.addChart( new GC.App.Charts["Weight Chart"](), 0 );
					leftPane.addChart( new GC.App.Charts["Percentile Chart"](), 1 );
					leftPane.addChart( new GC.App.Charts["Chart Stack"]([ 
						new GC.App.Charts["Body Mass Index Chart"](), 
						new GC.App.Charts["Head Circumference Chart"]() 
					]), 1 );
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
	
	setStageHeight();
	draw("graphs");
	
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
/*global Chart, GC, PointSet, strPad, weeks2months, Raphael, XDate, console,
 Raphael*/
/*jslint eqeq: true, nomen: true, plusplus: true, newcap: true */
if(!window.localStorage) {
	window.localStorage = {};
}

(function(NS, $) {
	
	//"use strict";
	
	NS.App = {};
	
	var DEBUG_MODE    = GC.chartSettings.appEnvironment === "DEVELOPMENT",
		leftPane      = null, 
		parentalDarwn = false, 
		drawn         = false,
		PATIENT       = null,
		BIRTH_XDATE   = new XDate(),
		MIN_WEEK_DIFF = GC.chartSettings.minTimeInterval / GC.Constants.TIME.WEEK,
		BROADCASTER   = $("html"), 
		
		PRIMARY_CHART_TYPE    = "CDC", // CDC, WHO etc.
		CORRECTION_CHART_TYPE = "CDC", // CDC, WHO etc.
		
		START_WEEK = 0,
		END_WEEK   = 26.08928571428572,
		
		START_AGE_MOS = null,
		END_AGE_MOS = null,
		GENDER = null,
		
		MILISECOND = GC.Constants.TIME.MILISECOND,
        SECOND     = GC.Constants.TIME.SECOND,
        MINUTE     = GC.Constants.TIME.MINUTE,
        HOUR       = GC.Constants.TIME.HOUR,
        DAY        = GC.Constants.TIME.DAY,
        WEEK       = GC.Constants.TIME.WEEK,
        MONTH      = GC.Constants.TIME.MONTH,
        YEAR       = GC.Constants.TIME.YEAR,
        
		RENDER_FOR_PRINT = $("html").is(".before-print"),
        PRINT_WINDOW = null;
		
	window.debugLog = function(a) {
		if ( DEBUG_MODE && window.console ) {
			console.log(a);
		}
	};
	
	// gender ------------------------------------------------------------------
	function getGender() {
		if ( !GENDER ) {
			GENDER = PATIENT.gender;
		}
		return GENDER;
	}
	
	function setGender( gender ) {
		if ( gender == "female" || gender == "male" ) {
			PATIENT.gender = GENDER = gender;
			$('input:radio[name=gender][value=' + gender + ']').prop("checked", true);
			$("html").toggleClass("male", gender == "male").toggleClass("female", gender == "female");
			BROADCASTER.trigger("set:gender", [gender]);
		}
	}
	
	// percentiles -------------------------------------------------------------
	GC.Preferences._get__percentiles = function() {
		return $.map($.makeArray(this._data.percentiles), function(n) {
			return parseFloat(n);
		});
	};
	
	GC.Preferences._set__percentiles = function(pct) {
		return $.map($.makeArray(pct), function(n) {
			return parseFloat(n);
		});
	};
	
	GC.Preferences.bind("set:percentiles", function(e) {
		var _pct  = $.makeArray(e.data.newValue).join(","),
			input = $('input:radio[name=percentile][value="' + _pct + '"]');
		if (input.length) {
			input.prop("checked", true);
			
		}
		//$("html").trigger("set:percentiles", [e.data.newValue]);
	});
	
	GC.Preferences.bind("set:pctz", function(e) {
		$('[name=pctz]').val(e.data.newValue).trigger("change");
		//$("html").trigger("set:PCTZ", [e.data.newValue]);
	});
	
	
	
	// START_WEEK --------------------------------------------------------------
	function getStartWeek() {
		return START_WEEK;
	}
	
	function setStartWeek( n, silent ) {
		NS.App._START_WEEK = START_WEEK = Math.min(GC.Util.floatVal(n), END_WEEK - MIN_WEEK_DIFF);
		START_AGE_MOS = null;
		END_AGE_MOS = null;
		getStartAgeMos();
		getEndAgeMos();
		var range = START_WEEK + ":" + END_WEEK;
		$('input:radio[name="time-range"]').each(function(i, o) {
			this.checked = this.value == range;
			$( this ).closest("label").toggleClass( "active", this.checked );
		});
		
		var slider = $("#time").data("slider");
		if (slider) {
			slider.values([START_WEEK, END_WEEK]);
		}
		$('#start-age-mos').val(Math.round(getStartAgeMos()));
		if ( !silent ) {
		  BROADCASTER.trigger("set:weeks", [START_WEEK, END_WEEK]);
		}
		return true;
	}
	
	// END_WEEK ----------------------------------------------------------------
	function getEndWeek() {
		return END_WEEK;
	}
	
	function setEndWeek( n, silent ) {
		NS.App._END_WEEK = END_WEEK = Math.max(GC.Util.floatVal(n), START_WEEK + MIN_WEEK_DIFF);
		START_AGE_MOS = null;
		END_AGE_MOS = null;
		getStartAgeMos();
		getEndAgeMos();
		var range = START_WEEK + ":" + END_WEEK;
		$('input:radio[name="time-range"]').each(function(i, o) {
			this.checked = this.value == range;
			$( this ).closest("label").toggleClass( "active", this.checked );
		});
		
		var slider = $("#time").data("slider");
		if (slider) {
			slider.values([START_WEEK, END_WEEK]);
		}
		
		$('#end-age-mos').val(Math.round(getEndAgeMos()));
		
		if ( !silent ) {
			BROADCASTER.trigger("set:weeks", [START_WEEK, END_WEEK]);
		}
		
		return true;
	}
	
	// Weeks -------------------------------------------------------------------
	function getWeeks()	{
		return END_WEEK - START_WEEK;
	}
	
	// startAgeMos -------------------------------------------------------------
	function setStartAgeMos( months ) {
		return setStartWeek(months * MONTH / WEEK);
	}
	
	function getStartAgeMos() {
		if ( START_AGE_MOS === null ) {
			var tmp = BIRTH_XDATE.clone().addWeeks(START_WEEK);
			START_AGE_MOS = BIRTH_XDATE.diffMonths(tmp);
			tmp = null;
		}
		return START_AGE_MOS;
	}
	
	// endAgeMos ---------------------------------------------------------------
	function setEndAgeMos( months ) {
		return setEndWeek(months * MONTH / WEEK);
	}
	
	function getEndAgeMos() {
		if ( END_AGE_MOS === null ) {
			var tmp = BIRTH_XDATE.clone().addWeeks(END_WEEK);
			END_AGE_MOS = BIRTH_XDATE.diffMonths(tmp);
			tmp = null;
		}
		return END_AGE_MOS;
	}
	
	// PRIMARY_CHART_TYPE (Primary DataSet) ------------------------------------
	function getPrimaryChartType() {
		return PRIMARY_CHART_TYPE;
	}
	
	// CORRECTION_CHART_TYPE (Secondary DataSet) -------------------------------
	function getCorrectionalChartType() {
		return CORRECTION_CHART_TYPE;
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
			top : top//,
			//marginTop : marginTop,
			//bottom : bottom
		});
		
		if (RENDER_FOR_PRINT) {
			$("#stage").css("height", $(window).height() - bottom - top - marginTop);
		}
	}
	
	function selectRangeForAge(age) {
	    var weeks = age / WEEK;
	    $('input:radio[name="time-range"]').each(function(i, o) {
            var values = this.value.split(":");
            if (GC.Util.floatVal(values[0]) <= weeks && 
                GC.Util.floatVal(values[1]) >= weeks) {
                setStartWeek( values[0], true );
                setEndWeek( values[1] );
                return false;
            }
        });
	}
	
	function getFitRange() {
		var first = PATIENT.getFirstModelEntry(),
			last  = PATIENT.getLastModelEntry(),
			step,
			lastAge,
			range;
			
		if (!first || !last) {
			return null;
		}
		
		lastAge  = last.agemos  * GC.Constants.TIME.MONTH;
		firstAge = first.agemos * GC.Constants.TIME.MONTH;
		range    = lastAge - firstAge;
		step     = GC.Constants.TIME.YEAR;
		
		if (range < GC.Constants.TIME.YEAR * 2) {
			step = GC.Constants.TIME.MONTH;
		}
		
		if (range < GC.Constants.TIME.MONTH * 2) {
			step = GC.Constants.TIME.WEEK;
		}
		
		if (range < GC.Constants.TIME.WEEK * 2) {
			step  = GC.Constants.TIME.DAY;
		}
		
		return [
			Math.max(0, (firstAge - step) / GC.Constants.TIME.WEEK),
			(lastAge + step) / GC.Constants.TIME.WEEK
		];
	}
	
	function fitToData() {//debugger;
		var range = getFitRange();
		if (range) {
			setStartWeek(range[0], true);
			setEndWeek(range[1]);
		}
	}
	
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
					NS.App.Pane = leftPane;
					NS.App.ChartsView = leftPane;
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
	
	
	
	
	
	NS.App.DEBUG_MODE     = DEBUG_MODE;
	NS.App.Charts = [];
	NS.App.getPatient     = function getPatient() { return PATIENT; };
	NS.App.getGender      = getGender;
	NS.App.setGender      = setGender;
	NS.App.getStartWeek   = getStartWeek;
	NS.App.setStartWeek   = setStartWeek;
	NS.App.getEndWeek     = getEndWeek;
	NS.App.setEndWeek     = setEndWeek;
	NS.App.getWeeks       = getWeeks;
	NS.App.getStartAgeMos = getStartAgeMos;
	NS.App.getEndAgeMos   = getEndAgeMos;
	NS.App.setStartAgeMos = setStartAgeMos;
	NS.App.setEndAgeMos   = setEndAgeMos;
	NS.App.selectRangeForAge   = selectRangeForAge;
	NS.App.getPrimaryChartType      = getPrimaryChartType;
	NS.App.getCorrectionalChartType = getCorrectionalChartType;
	NS.App.fitToData = fitToData;
	NS.App.getFitRange = getFitRange;
	
	NS.App.getPCTZ = function() { return GC.Preferences.prop("pctz"); };
	NS.App.setPCTZ = function(v) { GC.Preferences.prop("pctz", v); };
	NS.App.getMetrics = function() { return GC.Preferences.prop("metrics"); };
	NS.App.setMetrics = function(v) { GC.Preferences.prop("metrics", v); };
	
	//NS.Util.createProperty( NS.App, { 
	//	name      : "PCTZ", 
	//	//inputName : "pctz",
	//	model     : "Preferences",
	//	path      : "pctz"
	//});
	
	//NS.Util.createProperty( NS.App, { name : "metrics"          , inputName : "metrics"            });
	NS.Util.createProperty( NS.App, { name : "showPretermArrows", inputName : "show-preterm"       });
	NS.Util.createProperty( NS.App, { name : "language"         , inputName : "language"           });
	NS.Util.createProperty( NS.App, { name : "gestCorrectionDuration", inputName : "gest-correction-duration"});
	NS.Util.createProperty( NS.App, { name : "gestCorrectionType"    , inputName : "gest-correction-type"});
	NS.Util.createProperty( NS.App, { name : "correctionAge"    , inputName : "correction-age" });
	
	NS.Util.createProperty( NS.App, { 
		name : "viewType",
		getter : function() {
			return $("#view-mode > [data-value].active").attr("data-value");
		},
		model : "Preferences",
		path : "initialView"
	});
	
	$(function() {
		$( "#dialog" ).dialog({ 
			autoOpen: false,
			modal : true,
			resizable: false,
			dialogClass : "gc-dialog",
			position : "center"
		});
	});
	
	NS.App.dialog = function(url, args, options) {
        
        $( "#dialog" ).empty().html('<div class="content">' + 
            '<p style="text-align:center">' + 
                '<img src="img/spinner.gif" />' + 
                '<br />' + 
                '<br />' + 
                'Loading...' + 
            '</p>' + 
        '</div>')
        .data("dialogProxy", { "arguments": $.makeArray(args) })
		.dialog("close")
		.dialog("option", $.extend({
            minWidth : 300,
            width    : 300,
            title    : "Loading...",
            position : "center"
        }, options))
        .dialog( "open" );
        
        setTimeout(function() {
            $( "#dialog" )
            .find("> .content")
            .load(url);
        }, 500);
    };
    
    NS.App.addEntry = function() {
        GC.App.dialog("add_edit_dataentry.html", null, { modal: true });
    };
    
    NS.App.editEntry = function(entry) {
        GC.App.dialog("add_edit_dataentry.html", entry, { modal: true });
    };
	
	NS.App.editSettings = function() {
		GC.App.dialog("settings-editor.html", null, { 
			"modal"  : false,
			"title"  : "Preferences",
			"height" : "auto",
			"width"  : "auto"
		});
    };
	
	NS.App.viewAnnotations = function() {
		GC.App.dialog("annotations.html", null, { 
			"modal"     : false,
			"title"     : "Annotations",
			//"minHeight" : 100,
			//"maxHeight" : 600,
			//"minWidth"  : 300,
			//"maxWidth"  : 1000,
			resizable   : true,
			width : 500,
			height: 500
		});
    };
	
    NS.App.print = function() {
		if(PRINT_WINDOW == null || PRINT_WINDOW.closed) {
			PRINT_WINDOW = window.open(
				"print-charts.html", 
				"printWindow", 
				"resizable=yes,scrollbars=yes,status=yes,top=10,left=10,width=1100,height=800"
			);
		} else {
			PRINT_WINDOW.focus();
		}
    };
	
	NS.App.getLastDataAge = function() {
	    var out = 0;
		if (PATIENT) {
			var lastDate, lastEntry = PATIENT.getLastModelEntry();
			if (lastEntry) {
				lastDate = PATIENT.DOB.clone().addMonths(lastEntry.agemos);
				out = PATIENT.DOB.diffMilliseconds(lastDate);
			}
		}
		return out;
	};
	
	NS.App.refresh = function() {
		NS.App.getPatient().refresh();
		draw();
	};
	
	$(window).bind("keydown keyup keypress", function(e) {
		if (e.keyCode == 80 && e.ctrlKey) {
			if (e.type == "keyup") {
				NS.App.print();
			}
			return false;
		}
	});
	
	$(window).bind("beforeprint print", false);
	
	function Widget(cfg) {
		
		cfg.view.bind(cfg.changeEvent || "change", function(e) {
			//if ( !e.isDefaultPrevented() ) {
				cfg.model.prop(cfg.path, format(cfg.view.val(), cfg.type));
			//}
		}).val(cfg.model.prop(cfg.path)).triggerHandler(cfg.changeEvent || "change");
		
		cfg.model.bind("set:" + cfg.path, function(e) {//console.log(e.type);
			cfg.view.val(e.data.newValue).trigger(cfg.changeEvent || "change");
		});
	}
	
	GC.DataType = {
		FLOAT    : 1,
		INT      : 2,
		UNSIGNED : 4,
		STRING   : 8,
		BOOLEAN  : 16
	};
	
	function format(x, dataType, defaultValue) {
		var out = x;
		do {
			if (dataType & GC.DataType.FLOAT) {
				out = GC.Util.floatVal(x, defaultValue);
				break;
			}
			
			if (dataType & GC.DataType.INT) {
				out = GC.Util.intVal(x, defaultValue);
				break;
			}
			
			if (dataType & GC.DataType.BOOLEAN) {
				out = /^(true|1|y|yes|on)$/i.test(String(x));
				break;
			}
			
			if (dataType & GC.DataType.STRING) {
				out = String(x);
				break;
			}
			
		} while (false);
		
		if ((dataType & GC.DataType.FLOAT) || (dataType & GC.DataType.INT)) {
			if (dataType & GC.DataType.UNSIGNED) {
				out = Math.abs(out);
			}
		}
		
		return out
	}
	
	
	
	// =========================================================================
	// Start of selection methods
	// =========================================================================
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
	// =========================================================================
	// End of selection methods
	// =========================================================================
	
	$(function initUI() {
		
		setStageHeight();
		//return;
		var stage         = $("#stage"),
			stage1        = stage.find(".stage-1" ),
			
			QUEUE         = new GC.Util.TaskQueue({
				onChange : function(task) {
					$("#loading-indicator .msg").text(task.description);
				},
				onComplete : function() {
					$("#loading-indicator .msg").text("All tasks compleeted!");
					$("#loading-indicator").delay(500).fadeOut(400, function() {
						$(this).hide();
					});
				}
			});
		
		function setInitialState( done ) {
			
			$("html")
				.toggleClass("debug-mode", DEBUG_MODE)
				.toggleClass("dev", GC.chartSettings.appEnvironment == "DEVELOPMENT")
				.toggleClass("prod", GC.chartSettings.appEnvironment == "PRODUCTION");
			
			$.helperStyle("#dummy", {});
			
			if (PATIENT) {
				var age         = PATIENT.getCurrentAge();
				var corretedAge = PATIENT.getCorretedAge();
				
				setGender(PATIENT.gender);
				BIRTH_XDATE = new XDate(PATIENT.birthdate);
				$('#patient-name').text(PATIENT.name);
				$('#patient-age').text(age.toString(GC.chartSettings.timeInterval));
				$('#patient-birth').text(BIRTH_XDATE.toString(GC.chartSettings.dateFormat));
				$('#patient-gender').text(PATIENT.gender);
				$('#start-age-mos').val(0);
				$('#end-age-mos').val(6);
				
				if (PATIENT.weeker) {
					$("#weeker").show().find(".value").html(PATIENT.weeker + " weeker");
				}
				
				if (corretedAge.getDays() !== age.getDays()) {
					$("#corrected-age").html(corretedAge.toString(GC.chartSettings.timeInterval)).parent().show();
				} else {
					$("#corrected-age").parent().hide();
				}
				
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
				
				done();
			}
		}
		
		function render( done ) {
			GC.App.setViewType(GC.chartSettings.initialView);
			
			if ( $.isFunction(done) ) { // can be event too
				done();
			}
		}
		
		function onModelsReady() {
			return $.when(
				GC.Preferences.sync(),
				GC.Scratchpad.sync()
			).then(function() {
				less.refresh();
			});
		}
		
		function loadData( done ) {
			
			//if (RENDER_FOR_PRINT && window.opener) {
			//	GC.currentPatient = PATIENT = window.opener.GC.currentPatient;
			//	GC.chartSettings = window.opener.GC.chartSettings;
			//	done();
			//	return;
			//}	
			
			if ( typeof SMART === "undefined" ) {
				alert("Error: SMART Connect interface not found");
					
				return;
			}
			
				var capabilities = {
						preferences : { read: false, write: false, unset : false },
						scratchpad  : { read: false, write: false, unset : false }
					};
				
				GC.SMART_READY = true;
				$("window").trigger("smartready");
				
				debugLog("Starting SMART data fetch");
				
					// Creates proxy objects for the scratchpad and preferences 
					// models that will work with the SMART server if supported,
					// or with local storage otherwise.
					
					// Initialize (sync.) the models and re-created the dynamic 
					// parts of the CSS
					onModelsReady,
						
						debugLog("Loading patient data");
						
						// Patient
						$.when(GC.get_demographics(), GC.get_vitals(0), GC.get_allergies())
						.then( 
							function (demographics, vitals, allergies) {
              console.log("Got all smart values", arguments);
								
								GC.currentPatient = PATIENT = new GC.Patient( demographics, vitals, allergies );
								GC.translateFentonDatasets(PATIENT);
								done();
							},
							function (message) {
								debugLog(message);
								alert (message.data);
							}
						);
		}
		
		function initUIControls( done ) {
			
			// Choose view type 
			// =================================================================
			
			$("html").bind("set:viewType", function(e, type) {
				
				var firstRender;
				
				$("#view-mode > [data-value]").each(function() {
					$(this).toggleClass(
						"active", 
						this.getAttribute("data-value") == type
					);
				});
				
				$("#view-clinical")[type == "graphs" ? "show" : "hide"]();
				$("#view-parental")[type == "parent" ? "show" : "hide"]();
				$("#view-table"   )[type == "table"  ? "show" : "hide"]();
				
				$("html")
				.toggleClass("view-clinical", type == "graphs" || type == "table")
				.toggleClass("view-parental", type == "parent")
				.toggleClass("view-charts"  , type == "graphs")
				.toggleClass("view-table"   , type == "table" );
				
				setStageHeight();
				
				draw(type);
			});
			
			$("#view-mode > [data-value]").click(function() {
				GC.App.setViewType($(this).attr("data-value"));
			});
			
			
		
			// Gender 
			// =================================================================
			$('input:radio[name=gender]').change(function() {
				setGender(this.value);
			});
			
			// Percentile
			// =================================================================
			$('input:radio[name=percentile]').change(function() {
				GC.Preferences.prop("percentiles", this.value.split(","));
			});
			
			// Time range slider
			// =================================================================
			$( "#time" ).slider({ 
				min : 0,
				max : 960,
				range : true,
				slide : function( e, ui ) {
					return setStartWeek( ui.values[0], true ) && setEndWeek( ui.values[1] );
				}
			});
			
			// Time range tabs and Zoom In
			// =================================================================
			(function() {
				var selectedTab;
				
				function onTimeRangeTabChange() {
					$(this).closest("#time-ranges").find("input").each(function() {
						$(this).closest('label').toggleClass("active", this.checked);
					});
				}
				
				var fitRange = GC.App.getFitRange();
				if (fitRange) {
					$("#btn-fit-to-age input").attr("value", fitRange.join(":"));
				}
				
				$("#time-ranges label").each(function() {
					var radio = $(this).find("input[type=radio]");
					if (radio.length) {
						$(this).bind("click", function(e) {
							radio.prop("checked", true).triggerHandler("change");
							selectedTab = this;
							return false;
						});
					}
				});
				
				$('input:radio[name="time-range"]').change(function() {
					var values = this.value.split(":");
					setStartWeek( values[0], true );
					setEndWeek( values[1] );
					$("html").removeClass("zooming").trigger("togglezooming");
				});
				
				$("html").bind("set:weeks", function() {
					var selected = $("#time-ranges label.active")[0];
					if (selected && !selectedTab) {
						selectedTab = selected;
					}
					$("#btn-toggle-zoom label").toggleClass("ui-state-disabled", !!selected);
					
					$("#time-ranges label").each(function() {
						$(this).toggleClass("intermediate", !selected && selectedTab === this);
					});
				});
				
				$("#time-ranges input")
				.bind("change.updateUI", onTimeRangeTabChange)
				.each(onTimeRangeTabChange);
				
				$("#btn-toggle-zoom label").click(function() {
					if ($(this).is(".ui-state-disabled")) {
						return false;
					}
					if (selectedTab) {
						$(selectedTab).trigger("click");
					}
				});
				
			}());
			
			// Time range number inputs
			// =================================================================
			$('#start-age-mos').bind("change", function() {	
				if ( !GC.App.setStartAgeMos(this.value) ) {
					this.value = GC.App.getStartAgeMos();
				}				
			});	
			$('#end-age-mos').bind("change", function() {	
				if ( !GC.App.setEndAgeMos(this.value) ) {
					this.value = GC.App.getEndAgeMos();
				}				
			});
			
			// Toggle settings button
			// =================================================================
			$(".settings-toggle").click(function() {
				$("body").toggleClass("settings-expanded");
				setStageHeight();
				draw();
			});
			
			// Choose primary and secondary datasets and related behaviors
			// =================================================================
			function onDataSetsChange() {
				$("#the-tab").toggleClass("double", !!PRIMARY_CHART_TYPE && !!CORRECTION_CHART_TYPE);
				$("#tab-btn-right").attr("title", $("#the-tab").is(".double") ? "Leave only the left data source as primary" : "Add secondary data source");
			}
			
			// Swap dataSets
			$("#tab-btn-switch").click(function() {
				if ( !!CORRECTION_CHART_TYPE ) {
					var d1 = PRIMARY_CHART_TYPE;
					var d2 = CORRECTION_CHART_TYPE;
					$("#secondary-ds").menuButton("value", d1);
					$("#primary-ds").menuButton("value", d2);
				}
			});
			
			
			$("#tab-btn-left").click(function() {
				if ( !!CORRECTION_CHART_TYPE ) {
					$("#primary-ds"  ).menuButton("value", CORRECTION_CHART_TYPE, true);
					$("#secondary-ds").menuButton("index", -1, true);
					CORRECTION_CHART_TYPE = "";
					BROADCASTER.trigger("set:primaryData", [ PRIMARY_CHART_TYPE ]);
					BROADCASTER.trigger("set:secondaryData", [ CORRECTION_CHART_TYPE ]);
					onDataSetsChange();
				}
			});
			
			$("#tab-btn-right").click(function() {
				
				if ( $("#the-tab").is(".double") ) {
					// Remove secondary dataset
					if (!!CORRECTION_CHART_TYPE) {
						$("#secondary-ds").menuButton("index", -1, true);
						CORRECTION_CHART_TYPE = "";
						BROADCASTER.trigger("set:secondaryData", [ "" ]);
					}
					$("#the-tab").removeClass("double");
				}
				// (enable to) Add secondary dataset
				else {
					$("#the-tab").addClass("double");
				}
				
				this.title = $("#the-tab").is(".double") ? "Leave only the right data source as primary" : "Add secondary data source";
			});
			
			
			if (PATIENT.getCurrentAge().getYears() > 2) {
				$("#primary-ds").menuButton("value", GC.chartSettings.defaultChart);
			} else {
				if (PATIENT.isPremature()) {
					$("#primary-ds").menuButton("value", GC.chartSettings.defaultPrematureChart);
				} else {
					$("#primary-ds").menuButton("value", GC.chartSettings.defaultBabyChart);
				}
			}
			//$("#primary-ds").menuButton("value", "CDC");
			//$("#secondary-ds").menuButton("value", "DS");
			
			PRIMARY_CHART_TYPE = $("#primary-ds").bind("menubuttonchange", function(e, data) {
				PRIMARY_CHART_TYPE = data.value;
				onDataSetsChange();
				BROADCASTER.trigger("set:primaryData", [ data.value ]);
			}).menuButton("value");
			
			CORRECTION_CHART_TYPE = $("#secondary-ds").bind("menubuttonchange", function(e, data) {
				CORRECTION_CHART_TYPE = data.value;
				onDataSetsChange();
				BROADCASTER.trigger("set:secondaryData", [ data.value ]);
			}).menuButton("value");
			
			$("#the-tab").toggleClass("double", !!PRIMARY_CHART_TYPE && !!CORRECTION_CHART_TYPE);
			
			
			// checkbox-button
			// =================================================================
			function onCheckboxButtonChange() {
				$(this).closest(".checkbox-button")
				.toggleClass("on", this.checked)
				.toggleClass("off", !this.checked);
			}
			$(".checkbox-button input")
			.bind("change.updateUI click.updateUI", onCheckboxButtonChange)
			.each(onCheckboxButtonChange);
			
			
			// Mid. parental height 
			// =================================================================
			$('[name="fader-height"]').bind("change", function() {
				PATIENT.setFamilyHistory({ father : { height : this.value } });
				$('[name="mid-height"]').val(PATIENT.midParentalHeight + "cm");
				BROADCASTER.trigger("set:midParentalHeight", [ PATIENT.midParentalHeight ]);
			}).val( PATIENT.familyHistory.father.height || "");
			
			$('[name="mother-height"]').bind("change", function() {
				PATIENT.setFamilyHistory({ mother : { height : this.value }	});
				$('[name="mid-height"]').val(PATIENT.midParentalHeight + "cm");
				BROADCASTER.trigger("set:midParentalHeight", [ PATIENT.midParentalHeight ]);
			}).val( PATIENT.familyHistory.mother.height || "");
			
			
			// PRETERM inputs
			// =================================================================
			function displayGestationAge() {
				var t = new GC.TimeInterval().setMonths(Math.abs(PATIENT.gestationAge));
				$("[name=GA]").val( (PATIENT.gestationAge < 0 ? "-" : "") + t.toString(GC.chartSettings.timeInterval));
				BROADCASTER.trigger("set:gestationAge", [ PATIENT.gestationAge ]);
			}
			
			BROADCASTER.bind("set:patientDOB", function(e, d) {
				$("#patient-age").text( 
					(new GC.TimeInterval())
					.setStartDate(d)
					.toString(GC.chartSettings.timeInterval)
				);
			});
			GC.Preferences.bind("set", function(e) {
				if (e.data.path.indexOf("timeInterval") === 0) {
				$("#patient-age").text( 
					(new GC.TimeInterval())
					.setStartDate(PATIENT.DOB)
					.toString(GC.chartSettings.timeInterval)
				);
				}
			});
			
			// DOB -------------------------------------------------------------
			$('[name="DOB"]').val( PATIENT.DOB.toString( GC.chartSettings.dateFormat ) ).datepicker({ 
				dateFormat: GC.Util.cDateFormatToJqFormat(GC.chartSettings.dateFormat)
			}).change(function() {
				PATIENT.setDOB( $( this ).datepicker( "getDate" ) );
				BROADCASTER.trigger("set:patientDOB", [ PATIENT.DOB ]);
				displayGestationAge();
			});
			GC.Preferences.bind("set:dateFormat", function(e) {
				var format = e.data.newValue,
					str = PATIENT.DOB.toString(format);
				$('[name="DOB"]').datepicker("option", "dateFormat", GC.Util.cDateFormatToJqFormat(format)).val(str);
				$('#patient-birth').text(str);
			});
			
			// EDD -------------------------------------------------------------
			
			$('[name="EDD"]').val( 
				PATIENT.EDD ? PATIENT.EDD.toString( GC.chartSettings.dateFormat ) : ""
			).datepicker({ 
				dateFormat: GC.Util.cDateFormatToJqFormat(GC.chartSettings.dateFormat)
			}).change(function() {
				PATIENT.setEDD( $( this ).datepicker( "getDate" ) );
				BROADCASTER.trigger("set:patientEDD", [ PATIENT.EDD ]);
				displayGestationAge();
			});
			GC.Preferences.bind("set:dateFormat", function(e) {
				if (PATIENT.EDD) {
					var format = e.data.newValue,
						str = PATIENT.EDD.toString(format);
					$('[name="EDD"]').datepicker("option", "dateFormat", GC.Util.cDateFormatToJqFormat(format)).val(str);
				}
			});
			
			
			// Starts Datatable temp. code
			// =================================================================
			
			
			
			$( ".add-entry" ).click(GC.App.addEntry);
			
			// =================================================================
			// Ends Datatable temp. code
			
			
			
			// pctz ------------------------------------------------------------
			Widget({
				model : GC.Preferences, 
				path  : "pctz", 
				view  : $('[name="pctz"]'), 
				type  : GC.DataType.STRING
			});
			
			// metrics ---------------------------------------------------------
			Widget({
				model : GC.Preferences, 
				path  : "metrics", 
				view  : $('[name="metrics"]'), 
				type  : GC.DataType.STRING
			});
			
			// aspectRatio -----------------------------------------------------
			Widget({
				model : GC.Preferences, 
				path  : "aspectRatio", 
				view  : $('[name="aspectRatio"]'), 
				type  : GC.DataType.FLOAT
			});
			
			// maxWidth --------------------------------------------------------
			Widget({
				model : GC.Preferences, 
				path  : "maxWidth", 
				view  : $('[name="maxWidth"]'), 
				type  : GC.DataType.INT,
				changeEvent : "blur"
			});
			
			// fontSize --------------------------------------------------------
			Widget({
				model : GC.Preferences, 
				path  : "fontSize", 
				view  : $('[name="fontSize"]'), 
				type  : GC.DataType.INT
			});
			
			
			
			
			done();
		}
		
		function setUIValues( done ) {
			
			var lastEntry = PATIENT.getLastModelEntry(),
                gestation = new GC.TimeInterval(),
                lastDate,
                lastAge,
                slider;
			
			// fontFamily
			GC.Preferences.bind("set:fontFamily", function(e) {
				$("body").css("fontFamily", e.data.newValue);
			});
			$("body").css("fontFamily", GC.chartSettings.fontFamily);
			
			// fontSize
			GC.Preferences.bind("set:fontSize", function(e) {
				$("body").css("fontSize", e.data.newValue);
				setStageHeight();
			});
			$("body").css("fontSize", GC.chartSettings.fontSize);
			
			// minWidth
			$('input[name="minWidth"]').change(function() { 
				$("body").css("minWidth", this.value + "px");
			});
			$("body").css("minWidth", GC.chartSettings.minWidth);
			
			// Display app version 
			$(".version").text(GC.chartSettings.version.toString());
			
			// Display Mid. Parental Height
			$('[name="mid-height"]').val( PATIENT.midParentalHeight + "cm" );
			
			// Display the patient's gestationalAge
			gestation.setMonths(Math.abs(PATIENT.gestationAge));
			$("[name=GA]").val( 
			    (PATIENT.gestationAge < 0 ? "-" : "") + gestation.toString(GC.chartSettings.timeInterval)
            );
			
			// Set the time range on the slider (if used)
			slider = $( "#time" ).data("slider");
			if (slider) {
			    slider.values([ START_WEEK, END_WEEK ]);
			}
			
			if (lastEntry) {
                lastDate = PATIENT.DOB.clone().addMonths(lastEntry.agemos);
                lastAge = new GC.TimeInterval();
                
                lastAge.setStartDate(PATIENT.DOB);
                lastAge.setEndDate(lastDate);
                
                // Display the last-recording date
                $(".last-recording .date").text(
                    lastDate.toString(GC.chartSettings.dateFormat)
                );
                
                // Display the last-recording age
                $(".last-recording .age").text(
                    lastAge.toString({
                        "Years"   : "y", 
                        "Year"    : "y", 
                        "Months"  : "m", 
                        "Month"   : "m", 
                        "Weeks"   : "w", 
                        "Week"    : "w", 
                        "Days"    : false,
                        "Day"     : false,
						separator : " "
                    })
                );
				
				GC.Preferences.bind("set:dateFormat", function(e) {
					$(".last-recording .date").text(
						lastDate.toString(e.data.newValue)
					);
				});
            }
			
			done();
		}
		
		QUEUE
		.add("Loading data..."    , loadData)
		.add("Set initial state"  , setInitialState)
		.add("Init UI Controls"   , initUIControls)
		.add("Set UI Values"      , setUIValues)
		.add("Notify AppReady"    , function(done) {
			BROADCASTER.trigger("appready");
			done();
		})
		.add("Render SVG Graphics", render)
		.start();
	});
	
	
	
	//if (RENDER_FOR_PRINT) {
	//	setTimeout(function() {
	//		setStageHeight();
	//		if ( leftPane ) {
	//			leftPane.draw();
	//		}
	//		if (confirm("Click OK to ptint now,\nor use \"Ctrl + P\" to print later.")) {
	//			window.print();
	//		}
	//	}, 200);
	//}
	
}(GC, jQuery));

// Percentiles - N/A

/*global $, Chart, GC, PointSet, strPad, weeks2months, Raphael, prompt*/
/*jslint eqeq: true, nomen: true, plusplus: true */
(function () {
	"use strict";
	
	var windowWidth = document.documentElement.clientWidth,
		PATIENT,
		Paper,
		PaperPredictedHeight,
		Latest;
		
	window.GC = window.GC || {};
	
	
	GC.pViewSettings = {
		windowWidth: windowWidth - 100
	};
	GC.AgeRanges = {};
	//The maximum age of a patient to be in the category in years
	GC.AgeRanges.Infant = 1;
	GC.AgeRanges.Toddler = 4;
	GC.AgeRanges.Child = 12;
	GC.AgeRanges.Adolescent = 20;
	//
	GC.NODATA = -999; //The value of a missing value
	GC.MinParentHeight = 60; //minimal height that a parent can have
	GC.MaxParentHeight = 300; //maximal height that a parent can have
	GC.FirstAnim = 0; //Flag for animation speed
	GC.AnimationTime = {}; //Animation durations in milliseconds
	GC.AnimationTime.Instantaneous = 0;
	GC.AnimationTime.Fast		   = 200;
	GC.AnimationTime.Medium        = 500;
	GC.AnimationTime.Slow		   = 700;
	GC.numberOfBoxes = 41; //number of the boxes used in the parent height
	GC.BoxHeightInCenitmeters = 5; //The height of each box in centimeters
	GC.CircleScale = 0.7; //For the easement of formulae each circle is with r=100px in definition and then is scaled by this value
	GC.PredictedHeightScale = 2.45;
	GC.MaxHeight = (GC.numberOfBoxes * GC.BoxHeightInCenitmeters + GC.BoxHeightInCenitmeters); //calculation for the maximum height on the chart

	
	$(function () {
		//creating the Raphael papers that will contain the SVG graphics
		Paper                = new Raphael("Paper");
		PaperPredictedHeight = new Raphael("PaperPredictedHeight", 588, 502.5);

		//Setting titles in the chosen language
		$("html").bind("set:language", function (e, selectedLanguageCode) {
			if (PATIENT) {
				setParentViewHTMLLabels();
				GC.TextFather.attr('text', GC.str("STR_131") + ": " + GC.heightFather + "cm");
				GC.TextMother.attr('text', GC.str("STR_132") + ": " + GC.heightMother + "cm");
				GC.LengthName.attr('text', GC.str("STR_2"));
				GC.WeightName.attr('text', GC.str("STR_6"));
				GC.HeadCircumferenceName.attr('text', GC.str("STR_13"));
			}
		});

		//Resizing
		var doit, lastWidth, pWrap = $("#pview-wrapper");
		$(window).resize(function () {
			var w = pWrap.width();
			if (lastWidth !== w && pWrap.is(":visible")) {
				lastWidth = w;
				if (doit) {
					window.clearTimeout(doit);
				}
				doit = window.setTimeout(function () {
					window.redrawPaper();
				}, 100);
			}
		});
	});
	
	

	//This function handles changes in the predicted height according to the mid parental formula:
	//Male patient: (Height of mother + Height of father + 13)/2
	//Female patient: (Height of mother + Height of father - 13)/2
	function predictedHeightChange() {
		//All the needed variables are initialized
		var TextPredicted = GC.PredictedHeight.TextPredicted,
			heightFather = GC.heightFather,
			width = GC.PredictedHeightVars.width,
			animationTime = GC.PredictedHeightVars.animationTime,
			scale = GC.PredictedHeightVars.scale,
			positionX = 0,
			bottom = GC.bottom,
			heightMother = GC.heightMother,
			TextMother = GC.TextMother,
			MotherHeightImage = GC.MotherHeightImage,
			MotherHeightLine = GC.MotherHeightLine,
			PredictedLine = GC.PredictedHeight.PredictedLine,
			heightPredicted,
			AnimatePredictedLine,
			AnimatePredictedText;
		//Calculating the new predicted height
		heightPredicted = midParentalHeight(heightMother, heightFather);
		heightPredicted = parseFloat(heightPredicted);
		//Animations for texts and lines
		AnimatePredictedLine = Raphael.animation({y: bottom - (heightPredicted / GC.BoxHeightInCenitmeters - 1) * GC.BoxHeightInCenitmeters * scale     }, animationTime);
		AnimatePredictedText = Raphael.animation({y: bottom - (heightPredicted / GC.BoxHeightInCenitmeters - 1) * GC.BoxHeightInCenitmeters * scale - 10}, animationTime);
		TextPredicted.attr('text', heightPredicted + "cm");
		PredictedLine.animate(AnimatePredictedLine);
		TextPredicted.animate(AnimatePredictedText);
	}
	
	function editParentHeight(type) {
		var heightTmp     = null,
			bottom        = GC.bottom,
			scale         = GC.PredictedHeightVars.scale,
			width         = GC.PredictedHeightVars.width,
			animationTime = GC.PredictedHeightVars.animationTime,
			imgPadTop     = 10,
			imgPadBottom  = 10,
			heightOld     = type == "mother" ? GC.heightMother      : GC.heightFather,
			image         = type == "mother" ? GC.MotherHeightImage : GC.FatherHeightImage,
			line          = type == "mother" ? GC.MotherHeightLine  : GC.FatherHeightLine,
			text          = type == "mother" ? GC.TextMother        : GC.TextFather,
			positionX     = type == "mother" ? 0 : 2 * width;
		
		if (type == "mother") {
			heightTmp = prompt(GC.str("STR_145") + ":", heightOld);
		}
		else if (type == "father") {
			heightTmp = prompt(GC.str("STR_146") + ":", heightOld);
		}
		
		if (heightTmp === null) { // on Cancel
			return;
		}
	
		heightTmp = GC.Util.floatVal(heightTmp);
		if (heightTmp < 100 ||  heightTmp > 250) {
			return alert(
				'"' + heightTmp + '" ' + 
				GC.str(type == "mother" ? "STR_150" : "STR_151")
			);
		} 
		
		if (heightTmp === heightOld) {
			return;
		}
		
		GC[type == "mother" ? "heightMother" : "heightFather"] = heightTmp;
		
		var w1 = image.attrs.width,
			h1 = image.attrs.height,
			x1 = image.attrs.x,
			h2 = (heightTmp / GC.BoxHeightInCenitmeters - 1) * GC.BoxHeightInCenitmeters * scale,
			w2 = w1 * (h2 - (imgPadBottom + imgPadTop)) / h1,
			x2 = positionX + width / 2 - w2 / 2;
		
		image.animate({
			x      : x2, 
			y      : bottom - h2 + imgPadTop,
			height : h2 - (imgPadBottom + imgPadTop),
			width  : w2
		}, animationTime);
		
		line.animate({ y : bottom - h2 }, animationTime);
		
		text.attr(
			'text', 
			GC.str(type == "mother" ? "STR_132" : "STR_131") + ": " + heightTmp + "cm"
		).animate({
			y: Math.max(bottom - h2 - imgPadTop, 10)
		}, animationTime);
		
		return heightTmp;
	}
	
	//Changing mother height with button
	function heightMotherEdit() {
		if (editParentHeight("mother")) {
			predictedHeightChange();
		}
	}

	//Changing father height with button
	function heightFatherEdit() {
		if (editParentHeight("father")) {
			predictedHeightChange();
		}
	}

	//This function is where all needed things are initialized for the first time
	function drawPaper(width, height, x, y, patient) {
		//Patient object
		PATIENT = GC.App.getPatient();
		//We get the width of the div for use in sizing functions
		GC.pViewSettings.windowWidth = $("#pview-wrapper").width();
		//Initializing and checking for needed data
		var lengthData = PATIENT.data.lengthAndStature,
			gender = GC.App.getGender();
		if (lengthData.length) {
			//Here predicted height chart is initialized 
			predictedHeight(
				PaperPredictedHeight,
				PATIENT.name,
				$("#pview-wrapper .right-column").width(),
				160,
				178,
				Math.round(lengthData[lengthData.length - 1].value)
			);
		}
		//Calculates the percentiles
		Latest = getPercentiles();
		//Draws the circles
		drawCirclesTogether(Latest.LengthPercentile, Latest.WeightPercentile, Latest.HeadCPercentile, '#357EC7', '#FBB917', '#78a845', 100, 170, Paper);
		//Draws Measures
		GC.LengthName = drawMeasure(10, 10, '#357EC7', Paper, GC.str("STR_2"), Latest.Length, 'cm');
		GC.WeightName = drawMeasure(10 + GC.pViewSettings.windowWidth / 6.0, 10, '#FBB917', Paper, GC.str("STR_6"), Latest.Weight, 'kg');
		GC.HeadCircumferenceName = drawMeasure((GC.pViewSettings.windowWidth / 6.0) * 2, 10, '#78a845', Paper, GC.str("STR_13"), Latest.Headc, 'cm');
		//HTML labels are initialized
		setParentViewHTMLLabels();
	}

	//This function handles the redrawing of the svg graphics when the browser window is resized
	function redrawPaper() {
		if (!PATIENT) return;
		//Used papers are cleared
		Paper.clear();
		PaperPredictedHeight.clear();
		//Here everything is initialized again
		GC.pViewSettings.windowWidth = $("#pview-wrapper").width();
		var lengthData = PATIENT.data.lengthAndStature;
		if (lengthData.length) {
			predictedHeight(
				PaperPredictedHeight,
				PATIENT.name,
				$("#pview-wrapper .right-column").width(),
				160,
				178,
				Math.round(lengthData[lengthData.length - 1].value)
			);
		}
		drawCirclesTogether(Latest.LengthPercentile, Latest.WeightPercentile, Latest.HeadCPercentile, '#357EC7', '#FBB917', '#78a845', 100, 170, Paper);
		GC.LengthName = drawMeasure(10, 10, '#357EC7', Paper, GC.str("STR_2"), Latest.Length, 'cm');
		GC.WeightName = drawMeasure(10 + GC.pViewSettings.windowWidth / 6.0, 10, '#FBB917', Paper, GC.str("STR_6"), Latest.Weight, 'kg');
		GC.HeadCircumferenceName = drawMeasure((GC.pViewSettings.windowWidth / 6.0) * 2, 10, '#78a845', Paper, GC.str("STR_13"), Latest.Headc, 'cm');
	}

	function getWhichDataSet() {
		var out = {
				Length : null,
				Weight : null,
				Headc  : null
			},
			src    = "CDC", //GC.App.getPrimaryChartType(),
			gender = PATIENT.gender;
		
		$.each({
			Length : { modelProp: "lengthAndStature", dsType : "LENGTH" },
			Weight : { modelProp: "weight"          , dsType : "WEIGHT" },
			Headc  : { modelProp: "headc"           , dsType : "HEADC" }
		}, function(key, meta) {
			var lastEntry = PATIENT.getLastModelEntry(function(entry) {
				return entry.hasOwnProperty( meta.modelProp );
			});
			
			if (lastEntry) {
				out[key] = GC.getDataSet(src, meta.dsType, gender, 0, lastEntry.agemos);
			}
		});

		return out;
	}

	function getPercentiles() {
		
		var dataSet = getWhichDataSet(),
			gender = PATIENT.gender,
			lastEntry,
			Latest = {};
		
		if (dataSet.Length) {
			lastEntry = PATIENT.getLastModelEntry(function(entry) {
				return entry.hasOwnProperty("lengthAndStature");
			});
			if (lastEntry) {
				Latest.AgeLength = lastEntry.agemos;
				Latest.Length    = lastEntry.lengthAndStature;
				Latest.LengthPercentile = GC.Util.round(
					GC.findPercentileFromX(lastEntry.lengthAndStature, dataSet.Length, gender, lastEntry.agemos) * 100
				);
			}
		}
		
		if (dataSet.Weight) {
			lastEntry = PATIENT.getLastModelEntry(function(entry) {
				return entry.hasOwnProperty("weight");
			});
			if (lastEntry) {
				Latest.AgeWeight = lastEntry.agemos;
				Latest.Weight    = lastEntry.weight;
				Latest.WeightPercentile = GC.Util.round(
					GC.findPercentileFromX(lastEntry.weight, dataSet.Weight, gender, lastEntry.agemos) * 100
				);
			}
		}
		
		if (dataSet.Headc) {
			lastEntry = PATIENT.getLastModelEntry(function(entry) {
				return entry.hasOwnProperty("headc");
			});
			if (lastEntry) {
				Latest.AgeHeadc = lastEntry.agemos;
				Latest.Headc    = lastEntry.headc;
				Latest.HeadCPercentile = GC.Util.round(
					GC.findPercentileFromX(lastEntry.headc, dataSet.Headc, gender, lastEntry.agemos) * 100
				);
			}
		}
		
		return Latest;
	}

	//HTML labels are set according to the language
	function setParentViewHTMLLabels() {
		if (GC.App.getGender() === 'male') {
			$('#genderData').text(GC.str("STR_135"));
		} else {
			$('#genderData').text(GC.str("STR_136"));
		}
		
		//$('#ageData').text(Math.floor(12 * years_apart(PATIENT.birthdate, Date())) + " " + GC.str("STR_17"));
		
		$('#ageData').text(PATIENT.getCurrentAge().toString(GC.chartSettings.timeInterval));
		$('#DOBData').text(PATIENT.DOB.toString(GC.chartSettings.dateFormat));
		$('#GestationData').text(PATIENT.gestationAge || "N/A");
		
		$('#AllergiesData').text(PATIENT.allergies.positive.join(", ") || GC.str("STR_149"));
		$('#EditMother').text(GC.str("STR_133"));
		$('#EditFather').text(GC.str("STR_134"));
		if (GC.App.getLanguage() === 'en') {
			$('#nameTextPredicted').text(PATIENT.name + GC.str("STR_137"));
		} else if (GC.App.getLanguage() === 'es') {
			$('#nameTextPredicted').text(GC.str("STR_137") + PATIENT.name);
		}
		$('#predictedSubtitle').text(GC.str("STR_138"));
		$('#genderText').text(GC.str("STR_139") + ":");
		$('#ageText').text(GC.str("STR_140") + ":");
		$('#DOBText').text(GC.str("STR_141") + ":");
		$('#GestationText').text(GC.str("STR_142") + ":");
		$('#AllergiesText').text(GC.str("STR_143") + ":");
		$('#nameText').text(PATIENT.name);
		$('#nameSubtitle').text(GC.str("STR_144"));
		$('#EditPatient').text(GC.str("STR_147"));
		$('#AddPhoto').text(GC.str("STR_148"));
	}

	//function that calculates age in years from birthday till today
	function getAgeYears() {
		return ((12 * years_apart(GC.App.getPatient().birthdate, Date()))) / 12;
	}

	//Calculates mid-parental height (when real formula is known may be move to gc-statistics.js)
	function midParentalHeight(heightMother, heightFather) {
		var heightPredicted;
		//Cm: (Father's Height + Mother's Height + 13) / 2
		if (GC.App.getGender() === 'male') {
			heightPredicted = (heightFather + heightMother + 13) / 2;
		} else if (GC.App.getGender() === 'female') {
		//Cm: (Father's Height - 13 + Mother's Height) / 2
			heightPredicted = (heightFather - 13 + heightMother) / 2;
		}
		return heightPredicted;
	}

	//returns either some shade of blue or some shade of pink according to gender
	function setColorAccordingToGender() {
		var color;
		if (PATIENT.gender === 'female') {
			color = '#FF73FF';
		} else if (PATIENT.gender === 'male') {
			color = '#74D5F7';
		}
		return color;
	}

	//function that draws the boxes of the predicted height graphic
	function drawPredictedHeightBoxes(totalWidth, color, color2, Paper) {
		var positionX = 0,
			scale = GC.PredictedHeightScale,
			maxHeight = GC.MaxHeight,
			numberOfBoxes = GC.numberOfBoxes,
			width = totalWidth / 3,
			lightColor = GC.Util.mixColors(color, "#FFF"),
			darkColor = GC.Util.darken(color),
			i, y, h;
		
		for (i = 0; i < numberOfBoxes; i++) {
			
			y = i * scale * GC.BoxHeightInCenitmeters;
			h = GC.BoxHeightInCenitmeters * scale;
			
			Paper.rect(positionX, y, width, h).attr({
				fill  : lightColor, 
				stroke: 'white'
			}).addClass("crispedges").toBack();
			
			Paper.rect(positionX + width, y, width, h).attr({
				fill: color, 
				stroke: lightColor
			}).addClass("crispedges").toBack();
			
			Paper.rect(positionX + 2 * width, y, width, h).attr({
				fill: lightColor, 
				stroke: 'white'
			}).addClass("crispedges");
		}
	}
	
	function drawPredictedHeightLabels(totalWidth, color, color2, Paper) {
		var positionX = 0,
			scale = GC.PredictedHeightScale,
			maxHeight = GC.MaxHeight,
			numberOfBoxes = GC.numberOfBoxes,
			width = totalWidth / 3,
			lightColor = GC.Util.darken(color, 0.7),
			darkColor = GC.Util.darken(color, 0.5),
			i, y, h, val;
		
		for (i = 0; i < numberOfBoxes; i++) {
			
			y = i * scale * GC.BoxHeightInCenitmeters;
			h = GC.BoxHeightInCenitmeters * scale;
			val = maxHeight - GC.BoxHeightInCenitmeters * i;
			
			if (i % 2 === 0) {
				Paper.text(
					positionX + width - 4, 
					GC.BoxHeightInCenitmeters + y + 1.5, 
					val
				).attr({
					"fill" : lightColor,
					"text-anchor" : "end",
					"font-size" : 11
				});
				
				Paper.text(
					positionX + width * 2 + 4, 
					GC.BoxHeightInCenitmeters + y + 1.5, 
					val
				).attr({
					"fill" : lightColor,
					"text-anchor" : "start",
					"font-size" : 11
				});
			} else {
				Paper.text(
					positionX + width + 4, 
					GC.BoxHeightInCenitmeters + y + 1.5, 
					GC.Util.cmToUS(val, "'", "''")
				).attr({
					"fill" : darkColor,
					"text-anchor" : "start",
					"font-size" : 11
				});
			}
		}
	}

	function checkIfToAnimate() {
		if (GC.FirstAnim === 0) {
			GC.FirstAnim = 1;
			return GC.AnimationTime.Slow;
		} else {
			return GC.AnimationTime.Instantaneous;
		}
	}
	
	function getHeightImage(type, callback) {
		var base  = "img/pview/" + (PATIENT.gender == "male" ? "blue" : "pink"),
			years,
			img = new Image();
		
		img.onload = callback;
		
		if (type == "mother") {
			img.src = base + "MotherHeightImage.png";
		}
		
		else if (type == "father") {
			img.src = base + "FatherHeightImage.png";
		}
		
		else if (type == "child") {
			years = PATIENT.getCurrentAge().getYears();
			
			if (years <= GC.AgeRanges.Infant) {
				img.src = base + "BabyHeightImage.png";
			} 
			
			else if (years > GC.AgeRanges.Infant && years <= GC.AgeRanges.Toddler) {
				img.src = base + "ToddlerHeightImage.png";
			}
			
			else if (years > GC.AgeRanges.Toddler && years <= GC.AgeRanges.Child) {
				img.src = base + "ChildHeightImage.png";
			}
			
			else if (years > GC.AgeRanges.Child) {
				img.src = base + "TeenHeightImage.png";
			}
		}
	}
	
	//GC.getHeightImage = getHeightImage;

	//This function still does most of the work for the predictedheight graphic
	function predictedHeight(Paper, name, totalWidth, heightMother, heightFather, heightChild) {
		var numberOfBoxes = GC.numberOfBoxes,
			scale = GC.PredictedHeightScale,
			positionX = 0,
			positionY = 0,
			width = totalWidth / 3,
			maxHeight = GC.MaxHeight,
			ageYears = getAgeYears(),
			bottom = numberOfBoxes * GC.BoxHeightInCenitmeters * scale + positionY,
			tempPositionY = positionY,
			animationTime = checkIfToAnimate(),
			color = setColorAccordingToGender(), 
			color2 = GC.Util.readableColor(color, 0.2, 0.2), //Makes the second color, which is supposed to be for the text visible
			i,
			heightPredicted  = midParentalHeight(heightMother, heightFather),
			ParentsAnimation = Raphael.animation({opacity: 0.3}, animationTime),
			MotherHeightImage = Paper.image(),
			FatherHeightImage,
			BabyHeightImage;
		
		
		var qMother = 150/596,
			qFather = 150/823,
			heightMotherScaled = (heightMother / 5 - 1) * 5 * scale - 20,
			heightFatherScaled = (heightFather / 5 - 1) * 5 * scale - 20,
			heightChildScaled  = (heightChild  / 5 - 1) * 5 * scale - 20;
		
		
		drawPredictedHeightBoxes(totalWidth, color, color2, Paper);
		
		//getHeightImage("mother", function() {
		//	//this.height = heightMotherScaled;console.log(Paper)
		//	MotherHeightImage.attr({
		//		src : this.src,
		//		x : positionX + 0.3  * width, 
		//		y : bottom - (heightMother / 5 - 1) * 5 * scale + 10, 
		//		width : width * heightMother / Paper.height, 
		//		height : heightMotherScaled
		//	});
		//});
		//Here the correct images is put according to age and gender
		if (GC.App.getPatient().gender === 'male') {
			MotherHeightImage = Paper.image("img/pview/blueMotherHeightImage.png"   , positionX + 0.3  * width, bottom - (heightMother / 5 - 1) * 5 * scale + 10, 80 , heightMotherScaled);
			FatherHeightImage = Paper.image("img/pview/blueFatherHeightImage.png"   , positionX + 2.3  * width, bottom - (heightFather / 5 - 1) * 5 * scale + 10, 80 , heightFatherScaled);
			if (ageYears <= GC.AgeRanges.Infant) {
				BabyHeightImage = Paper.image("img/pview/blueBabyHeightImage.png"   , positionX + 1.3  * width, bottom - (heightChild  / 5 - 1) * 5 * scale + 10, 56 , heightChildScaled);
			} else if (ageYears > GC.AgeRanges.Infant && ageYears <= GC.AgeRanges.Toddler) {
				BabyHeightImage = Paper.image("img/pview/blueToddlerHeightImage.png", positionX + 1.3  * width, bottom - (heightChild  / 5 - 1) * 5 * scale + 10, 70 , heightChildScaled);
			} else if (ageYears > GC.AgeRanges.Toddler && ageYears <= GC.AgeRanges.Child) {
				BabyHeightImage = Paper.image("img/pview/blueChildHeightImage.png"  , positionX + 1.3  * width, bottom - (heightChild  / 5 - 1) * 5 * scale + 10, 90 , heightChildScaled);
			} else if (ageYears > GC.AgeRanges.Child) {
				BabyHeightImage = Paper.image("img/pview/blueTeenHeightImage.png"   , positionX + 1.18 * width, bottom - (heightChild  / 5 - 1) * 5 * scale + 10, 100, heightChildScaled);
			}
		} else if (GC.App.getPatient().gender === 'female') {
			MotherHeightImage = Paper.image("img/pview/pinkMotherHeightImage.png"   , positionX + 0.3  * width, bottom - (heightMother / 5 - 1) * 5 * scale + 10, 80 , heightMotherScaled);
			FatherHeightImage = Paper.image("img/pview/pinkFatherHeightImage.png"   , positionX + 2.3  * width, bottom - (heightFather / 5 - 1) * 5 * scale + 10, 80 , heightFatherScaled);
			if (ageYears <= GC.AgeRanges.Infant) {
				BabyHeightImage = Paper.image("img/pview/pinkBabyHeightImage.png"   , positionX + 1.3  * width, bottom - (heightChild  / 5 - 1) * 5 * scale + 10, 56 , heightChildScaled);
			} else if (ageYears > GC.AgeRanges.Infant && ageYears <= GC.AgeRanges.Toddler) {
				BabyHeightImage = Paper.image("img/pview/pinkToddlerHeightImage.png", positionX + 1.3  * width, bottom - (heightChild  / 5 - 1) * 5 * scale + 10, 70 , heightChildScaled);
			} else if (ageYears > GC.AgeRanges.Toddler && ageYears <= GC.AgeRanges.Child) {
				BabyHeightImage = Paper.image("img/pview/pinkChildHeightImage.png"  , positionX + 1.2  * width, bottom - (heightChild  / 5 - 1) * 5 * scale + 10, 90 , heightChildScaled);
			} else if (ageYears > GC.AgeRanges.Child) {
				BabyHeightImage = Paper.image("img/pview/pinkTeenHeightImage.png"   , positionX + 1.18 * width, bottom - (heightChild  / 5 - 1) * 5 * scale + 10, 100, heightChildScaled);
			}
		}
		//MotherHeightImage.attr("opacity", 0.0);
		//FatherHeightImage.attr("opacity", 0.0);
		
		MotherHeightImage.animate(ParentsAnimation);
		FatherHeightImage.animate(ParentsAnimation);
		
		//Variables the moving parts of the graphic are initialized
		
		var MotherHeightLine = Paper.rect(positionX + 1, bottom - 1,  width - 2, 2),
			AnimateMotherLine = Raphael.animation({ y: bottom - (heightMother / 5 - 1) * 5 * scale - 1 }, animationTime),
			
			ChildHeightLine = Paper.rect(positionX + width + 1, bottom - 1, width - 2, 2),
			AnimateChildLine = Raphael.animation({ y: bottom - (heightChild / 5 - 1) * 5 * scale }, animationTime),
			
			FatherHeightLine = Paper.rect(positionX + 2 * width + 1, bottom - 1, width - 2, 2),
			AnimateFatherLine = Raphael.animation({ y: bottom - (heightFather / 5 - 1) * 5 * scale }, animationTime),
			
			PredictedLine = Paper.rect(positionX + width + 1, bottom - 1, width - 2, 2).attr({
				'fill': "0-" + color + ":10-#000:50-" + color + ":90", 
				'stroke': "none"
			}).addClass("crispedges"),
			AnimatePredictedLine = Raphael.animation({ y: bottom - (heightPredicted / 5 - 1) * 5 * scale - 1}, animationTime),
			
			ChildAnimation = Raphael.animation({opacity: 0.7}, animationTime),
			TextMother = Paper.text(positionX + 5, bottom, GC.str("STR_132") + ": " + heightMother + "cm"),
			TextChild = Paper.text(positionX + width + width / 2, bottom, heightChild + "cm"),
			TextFather = Paper.text(positionX + 3 * width - 5, bottom, GC.str("STR_131") + ": " + heightFather + "cm"),
			TextPredicted = Paper.text(positionX + width + width / 2, bottom, heightPredicted + "cm"),
			AnimateMotherText = Raphael.animation({y: bottom - (heightMother / 5 - 1) * 5 * scale - 10}, animationTime),
			AnimateChildText = Raphael.animation({y: bottom - (heightChild / 5 - 1) * 5 * scale - 10}, animationTime),
			AnimateFatherText = Raphael.animation({y: bottom - (heightFather / 5 - 1) * 5 * scale - 10}, animationTime),
			AnimatePredictedText = Raphael.animation({y: bottom - (heightPredicted / 5 - 1) * 5 * scale - 10}, animationTime),
			LinesAndTextsAnimation = {Father: AnimateFatherText, Mother: AnimateMotherText, Child: AnimateChildText, Predicted: AnimatePredictedText, FatherLine: AnimateFatherLine, MotherLine: AnimateMotherLine, ChildLine: AnimateChildLine, PredictedLine: AnimatePredictedLine},
			LinesAndTexts = {FatherText: TextFather, FatherLine: FatherHeightLine, MotherText: TextMother, MotherLine: MotherHeightLine, ChildLine: ChildHeightLine, ChildText: TextChild, PredictedLine: PredictedLine, PredictedText: TextPredicted};

		//Attributes are set here
		TextPredicted.attr({"font-size": 7 * scale, "font-weight": "bold"});
		TextFather.attr({"text-anchor": "end", fill: color2, "font-size": 7 * scale, "font-weight": "bold"});
		TextChild.attr({fill: color2, "font-size": 7 * scale, "font-weight": "bold"});
		TextMother.attr({"text-anchor": "start", fill: color2, "font-size": 7*scale, "font-weight": "bold"});
		
		ChildHeightLine.attr({
			'fill': "0-" + color + "-" + color2 + "-" + color, 
			'stroke': "none"
		}).addClass("crispedges");
		
		MotherHeightLine.attr({
			'fill': "0-" + color2 + "-" + GC.Util.mixColors(color, "#FFF"), 
			'stroke': "none"
		}).addClass("crispedges");
		
		FatherHeightLine.attr({
			'fill': "0-" + GC.Util.mixColors(color, "#FFF") + "-" + color2, 
			'stroke': "none"
		}).addClass("crispedges");
		
		drawPredictedHeightLabels(totalWidth, color, color2, Paper);
		
		animatePredictedHeight(LinesAndTextsAnimation, LinesAndTexts); //runs the animation function
		
		//Variables that would be useful are passed to the global object
		GC.PredictedHeightVars = {};
		GC.heightMother = heightMother;
		GC.TextMother = TextMother;
		GC.MotherHeightImage = MotherHeightImage;
		GC.MotherHeightLine = MotherHeightLine;
		GC.PredictedHeightVars.scale = scale;
		GC.PredictedHeightVars.animationTime = animationTime;
		GC.bottom = bottom;
		GC.PredictedHeightVars.width = width;
		GC.heightFather = heightFather;
		GC.TextFather = TextFather;
		GC.FatherHeightImage = FatherHeightImage;
		GC.FatherHeightLine = FatherHeightLine;
		GC.PredictedHeight = {};
		GC.PredictedHeight.PredictedLine = PredictedLine;
		GC.PredictedHeight.TextPredicted = TextPredicted;
		drawNotches(Paper, positionX, width, bottom, scale, animationTime);
	}
	
	//This function draws 'notches' that correspond to old height measurements
	function drawNotches(Paper, positionX, width, bottom, scale, animationTime) {
		var lengthData = GC.App.getPatient().data.lengthAndStature, i;
		for (i = 0; i < lengthData.length - 2; i++) {
			Paper.path(
				"M" + (positionX + width * 2 - 24) + "," + 
				(bottom - ((lengthData[i].value) / 5 - 1) * 5 * scale) + ",h20"
			);
		}
	}

	function animatePredictedHeight(LinesAndTextsAnimation, LinesAndTexts) {
		//Animations are run
		LinesAndTexts.MotherText.animate(LinesAndTextsAnimation.Mother);
		LinesAndTexts.MotherLine.animate(LinesAndTextsAnimation.MotherLine);
		LinesAndTexts.ChildText.animate(LinesAndTextsAnimation.Child);
		LinesAndTexts.ChildLine.animate(LinesAndTextsAnimation.ChildLine);
		LinesAndTexts.PredictedText.animate(LinesAndTextsAnimation.Predicted);
		LinesAndTexts.PredictedLine.animate(LinesAndTextsAnimation.PredictedLine);
		LinesAndTexts.FatherLine.animate(LinesAndTextsAnimation.FatherLine);
		LinesAndTexts.FatherText.animate(LinesAndTextsAnimation.Father);
	}

	function drawIcons(positionX, positionY, text, Paper, data) {
		var squareWidth = GC.pViewSettings.windowWidth / 21,
			Graphic;
		//Objects, each image is drawn when it's needed
		if (text === GC.str("STR_2")) {
			Graphic = Paper.image("img/pview/LengthIcon.png", positionX, positionY, squareWidth, squareWidth);
		} else if (text === GC.str("STR_6")) {
			Graphic = Paper.image("img/pview/WeightIcon.png", positionX, positionY, squareWidth, squareWidth);
		} else if (text === GC.str("STR_13")) {
			Graphic = Paper.image("img/pview/HeadCircumferenceIcon.png", positionX, positionY, squareWidth, squareWidth);
		} else {
			//If there's no image for the the data a square is drawn
			Graphic = Paper.rect(positionX, positionY, 60, 70);
		}
		//If there's no data the image gets blurred (in supported browsers)
		if (data === "") {
			Graphic.blur(2);
		}
		return Graphic;
	}

	function getPaperWidth(Paper) {
		return document.getElementById(Paper).offsetWidth;
	}

	function drawMeasure(positionX, positionY, color, Paper, text, data, type) {
		data = Math.round(data);
		if (data === null) {
			color = "gray";
			data = "";
		}
		var Graphic    = drawIcons(positionX, positionY, text, Paper, data),
			TextType   = Paper.text(positionX + GC.pViewSettings.windowWidth / 11, positionY + 10, text),
			TextData   = Paper.text(positionX + GC.pViewSettings.windowWidth / 10.6, positionY + 45, data ? data + type : "N/A"),
			AnimateMeasures = Raphael.animation({opacity: 0.88}, GC.AnimationTime.Medium),
			width = getPaperWidth("Paper");
		//Attributes
		TextType.attr({'opacity': 0.0, 'fill': color, 'font-size': GC.pViewSettings.windowWidth / 71, 'font-weight': 'bold'});
		TextData.attr({'opacity': 0.0, 'fill': color, 'font-size': GC.pViewSettings.windowWidth / 37})
		Graphic.attr('opacity', 0.0);
		//Animation
		TextType.animate(AnimateMeasures);
		TextData.animate(AnimateMeasures);
		Graphic.animate(AnimateMeasures);
		return TextType;
	}

	function drawCirclesTogether(percentLength, percentWeight, percentHeadCircumference, color1, color2, color3, positionX, positionY, Paper) {
		//Runs the three circles together
		Paper.clear();
		
		color1 = GC.chartSettings.lengthChart.color;
		if (!percentLength && percentLength !== 0) {
			color1 = "gray";
		}
		
		color2 = GC.chartSettings.weightChart.color;
		if (!percentWeight && percentWeight !== 0) {
			color2 = "gray";
		}
		
		color3 = GC.chartSettings.headChart.color;
		if (!percentHeadCircumference && percentHeadCircumference !== 0) {
			color3 = "gray";
		}
		
		var width = getPaperWidth("Paper");
		
		drawOneCircle(percentLength           , Paper, positionX                  , positionY, color1);
		drawOneCircle(percentWeight           , Paper, positionX + width / 3      , positionY, color2);
		drawOneCircle(percentHeadCircumference, Paper, positionX + width * (2 / 3), positionY, color3);
	}

	function drawOneCircle(percent, Paper, positionX, positionY, color) {
		//Primary circle, semi-transparent, background
		//drawCircles(100*GC.CircleScale, Paper, positionX, positionY, color, 0.0);
		//Data circle which represents the percentile size
		var Circle = drawCircles(percent * GC.CircleScale, Paper, positionX, positionY, color, 0.8),
			AnimateArcs = Raphael.animation({opacity: 1.0}, GC.AnimationTime.Slow),//Animating the arcs
			Percentiles = [3, 15, 50, 85, 97],
			i, 
			//Percentiles = [5, 25, 50, 75, 95],
			Circles = []; //Array which would contain the percentile borders
		for (i = 0; i < Percentiles.length; i++) {
			Circles[i] = drawPercentiles(positionX, positionY, Percentiles[i] * GC.CircleScale, Paper).attr({
				"stroke": color,
				"stroke-opacity" : percent > Percentiles[i] ? 0 : 1
			}).animate(AnimateArcs.delay(200));
		}
		
		var ArcPercentileBorders = [Circles[0], Circles[1], Circles[2], Circles[3], Circles[4]],
		//Draws the number
			TextPercentile = drawTextOnCircles(positionX,positionY, Paper, percent, color);
		
		return [Circle, TextPercentile, ArcPercentileBorders];	
	}

	//A function which creates a circle and the "asymptotic"  lines accompaning it
	function drawPercentiles(x, y,radius, Paper) {
		return Paper.circle(x, y, radius).attr('opacity', 0);
	}

	function drawCircles(radius, Paper, x, y, color, opacity) {
		return Paper.circle(x, y, 0).attr({
			"stroke-opacity": 0, 
			"opacity": opacity, 
			"fill": color
		}).animate(
			Raphael.animation({ r: radius}, GC.AnimationTime.Medium)
		);
	}
	
	/**
	 * This function draws the Text on a Percentile Circle
	 */
	function drawTextOnCircles(x, y, Paper, value, color) {
		
		var set = Paper.set();
		
		// This one acts as color outline
		set.push(
			Paper.text(x, y, !value && value !== 0 ? "N/A" : value + "%").attr({
				"font-size"  : 20, 
				"fill"       : color, 
				"stroke"     : color, 
				"stroke-width": 3,
				"blur" : 1
			})
		);
		
		// The white text
		set.push(
			Paper.text(x, y, !value && value !== 0 ? "N/A" : value + "%").attr({	
				"font-size" : 20, 
				"fill"      : 'white', 
			})
		);
		
		return set;
	}

	//functions for outisde use
	window.drawPaper             = drawPaper;
	window.redrawPaper           = redrawPaper;
	window.predictedHeightChange = predictedHeightChange;
	window.heightFatherEdit      = heightFatherEdit;
	window.heightMotherEdit      = heightMotherEdit;
	
})();

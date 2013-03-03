function ToolTip(positionX, positionY, height, width, color, text, textColor, Paper)
{
	
	this.Label = Paper.rect(positionX+20,positionY-height/2,width,height);
	this.Label.attr({fill: color});
	this.Label.attr("stroke-opacity", 0.0);
	this.Shadow = this.Label.clone()
	this.Shadow.toBack();
	this.Shadow.attr({fill: 'black'})
	this.Shadow.blur(2);
	this.Shadow.attr({x: this.Label.attr('x')+1, y:this.Label.attr('y')+1, opacity: 0.2});
	this.Arrow = Paper.path("m"+positionX+","+positionY+", l20,-10, v20,z");
	this.Arrow.attr({fill: color});
	this.Arrow.attr("stroke-opacity", 0.0);
	this.Arrow.attr("opacity", 0.8);
	this.Text = Paper.text(positionX+25,positionY,text);
	this.Text.attr('text-anchor', 'start');
	this.Text.attr('fill', textColor);
	this.moveTooltip = function(positionX, positionY)
	{
		this.Label.attr({x: positionX+20, y:positionY-height/2});
		this.Shadow.attr({x: this.Label.attr('x')+1, y:this.Label.attr('y')+1});
		this.Text.attr({x: positionX+25,y: positionY});
		this.Arrow.animate({path: "m"+positionX+","+positionY+", l20,-10, v20,z"})
	}
	this.moveVertically = function(positionX, positionY, hop)
	{
		this.Label.attr({y:this.Label.attr('y')+hop});
		this.Shadow.attr({y:this.Label.attr('y')+1});
		this.Text.attr({y: this.Text.attr('y')+hop});
		this.Arrow.animate({path: "m"+positionX+","+positionY+", l20,"+(-10+hop)+", v20,z"})
	}
	this.hide = function()
	{
		this.Label.attr("opacity",0.0);
		this.Shadow.attr("opacity",0.0);
		this.Text.attr("opacity",0.0);
		this.Arrow.attr("opacity",0.0);
	}
	this.show = function()
	{
		this.Label.attr("opacity",1.0);
		this.Shadow.attr("opacity",0.2);
		this.Text.attr("opacity",1.0);
		this.Arrow.attr("opacity",0.8);
	}
	this.setText = function(text)
	{
		this.Text.attr('text',text+"%");
	}
}


function drawChartBackGround(positionX,positionY, Paper, mode, width, VerticalScale)
{
	//Width Sets the width of the chart, while VerticalScale sets the height
    var Data = GC.Data;

	//data arrays Loads from Json Objects Now
	var Measures = new Object();
	Measures.scale = VerticalScale;
	var height = Measures.scale*100;
	drawPercentileChart(positionX, positionY, height, width, Paper);
	var Boxes = new Array();
	var Texts = new Array();
	var Lines = new Array();
	Measures.numberOfButtons = 13;
	Measures.step = width/(2*Measures.numberOfButtons);
	Measures.bigStep = width/6;
	
	drawAllPercentileCurves(Data,positionX,positionY,Measures,Paper);
	
	for (i = 0; i<Measures.numberOfButtons; i++)
	{
		if (i!=0)
		{
			Texts.push(Paper.text(positionX+i*(Measures.step)+5,positionY-Measures.step+10,i));
		}
		else
		{
			Texts.push(Paper.text(positionX+i*(Measures.step),positionY-Measures.step+10,"Birth"));
		}
		Boxes.push(Paper.rect(positionX+i*(Measures.step),positionY-Measures.step,Measures.step,Measures.step));
		Lines.push(Paper.path("m"+(positionX+i*(Measures.step))+","+(positionY+height)+", v-"+(height+Measures.step)+""));
	}
	for (i = 0; i<3; i++)
	{	
		Texts.push(Paper.text(positionX+Measures.numberOfButtons*(Measures.step)+i*(Measures.bigStep)+30,positionY-Measures.step+10,(i+3)+" mos"));
		Boxes.push(Paper.rect(positionX+Measures.numberOfButtons*(Measures.step)+i*(Measures.bigStep), positionY-Measures.step,Measures.bigStep,Measures.step));
		Lines.push(Paper.path("m"+(positionX+Measures.numberOfButtons*(Measures.step)+i*(Measures.bigStep))+","+(positionY+height)+", v-"+(height+Measures.step)+""));
	}
	for (i = 0; i < Boxes.length; i++)
	{
		Lines[i].attr('stroke-opacity', 0.3);
		Boxes[i].attr('fill','#222');
		Boxes[i].attr('opacity',0.1);
		Boxes[i].attr('stroke-opacity', 0.0);
		Texts[i].attr("font-size", GC.pViewSettings.windowWidth/85);
		Texts[i].attr('text-anchor','start');
	}
	
	Texts[0].attr('font-size',GC.pViewSettings.windowWidth/106.6);
	
	
	var Labels = new Object();
	
	Labels.Length = new ToolTip(20, 20, 20, 60, '#357EC7', "100%", "#0000A0", Paper);
	Labels.Weight = new ToolTip(20, 40, 20, 60, '#FBB917', "100%", "#9D3D00", Paper);
	Labels.HeadCircumference = new ToolTip(20, 60, 20, 60, '#78a845', "100%", "#254117", Paper);
	Labels.Length.hide();
	Labels.Weight.hide();
	Labels.HeadCircumference.hide();
	
	/*
	Labels.Length = Paper.rect(20,20,60,20);
	Labels.Length.attr('fill','#357EC7');
	Labels.Length.attr('stroke-opacity',0.0);
	Labels.Length.attr('opacity',0.0);
	
	Labels.Weight = Paper.rect(20,20,60,20);
	
	
	Labels.Weight.attr('fill','#FBB917');
	Labels.Weight.attr('opacity',0.0);
	Labels.Weight.attr('stroke-opacity',0.0);
	Labels.HeadCircumference = Paper.rect(20,20,60,20);
	Labels.HeadCircumference.attr('fill','#78a845');
	Labels.HeadCircumference.attr('opacity',0.0);
	Labels.HeadCircumference.attr('stroke-opacity',0.0);
	var Shadows = new Object();
	Shadows.Length = Labels.Length.clone();
	Shadows.Weight = Labels.Length.clone();
	Shadows.HeadCircumference = Labels.Length.clone();
	
	Shadows.Length.toBack();
	Shadows.Weight.toBack();
	Shadows.HeadCircumference.toBack();
	Shadows.Length.attr({x: (Labels.Length.attr('x'))+5,y:(Labels.Length.attr('y'))+5 , fill:'black',opacity:0.0});
	Shadows.Length.blur(3);
	Shadows.Weight.blur(3);
	Shadows.HeadCircumference.blur(3);
	var Arrows = new Object();
	
	Arrows.Length = Paper.path("m20,20, l20,-10, v20,z");
	Arrows.Length.attr('stroke-opacity',0.0);
	Arrows.Length.attr('fill','#0000A0');
	
	Arrows.Weight = Paper.path("m20,20, l20,-10, v20,z");
	Arrows.Weight.attr('stroke-opacity',0.0);
	Arrows.Weight.attr('fill','#E56717');
	
	Arrows.HeadCircumference = Paper.path("m20,20, l20,-10, v20,z");
	Arrows.HeadCircumference.attr('stroke-opacity',0.0);
	Arrows.HeadCircumference.attr('fill','#254117');
	
	var TextsLabel = new Object();
	
	TextsLabel.Length = Paper.text(20,20,"");
	TextsLabel.Length.attr('font-size',GC.pViewSettings.windowWidth/320*3.5);
	TextsLabel.Length.attr('stroke','#0000A0');
	TextsLabel.Length.attr('fill','#0000A0');
	TextsLabel.Length.attr('opacity',0.0);
	TextsLabel.Length.attr('text-anchor','start');
	
	TextsLabel.Weight = Paper.text(20,40,"");
	TextsLabel.Weight.attr('font-size',GC.pViewSettings.windowWidth/320*3.5);
	TextsLabel.Weight.attr('stroke','#9D3D00');
	TextsLabel.Weight.attr('fill','#9D3D00');
	TextsLabel.Weight.attr('opacity',0.0);
	TextsLabel.Weight.attr('text-anchor','start');
	
	TextsLabel.HeadCircumference = Paper.text(20,60,"");
	TextsLabel.HeadCircumference.attr('font-size',GC.pViewSettings.windowWidth/320*3.5);
	TextsLabel.HeadCircumference.attr('stroke','#254117');
	TextsLabel.HeadCircumference.attr('fill','#254117');
	TextsLabel.HeadCircumference.attr('opacity',0.0);
	TextsLabel.HeadCircumference.attr('text-anchor','start');
	
	
	Arrows.Length.attr('opacity',0.0);
	Arrows.Weight.attr('opacity',0.0);
	Arrows.HeadCircumference.attr('opacity',0.0);
	*/
	var Colors = new Object();
	Colors.Over = '#aaa';
	Colors.Off  = '#222';
	Colors.Pressed = '#000';
	var lineAlpha = -10;
	
	//Button controls
	for (i = 0; i<Boxes.length; i++)
	{
		setBoxes(Paper, positionX, positionY, Lines, lineAlpha, Labels, Measures.scale,Measures.step,Measures.bigStep,Boxes,Texts, Measures.numberOfButtons,Colors,i, mode);
	}
}

function drawPercentileChart(positionX, positionY, height, width, Paper)
{
	drawPercentileLine(positionX,positionY,height,width+20,3, Paper);
	drawPercentileLine(positionX,positionY,height,width+20,15, Paper);
	drawPercentileLine(positionX,positionY,height,width+20,50, Paper);
	drawPercentileLine(positionX,positionY,height,width+20,85, Paper);
	drawPercentileLine(positionX,positionY,height,width+20,97, Paper);
}

function drawAllPercentileCurves(Data,positionX,positionY,Measures,Paper)
{
	drawPercentileCurve(Data,positionX,positionY,Measures,Paper,'#357EC7', "LengthPercentile");
	drawPercentileCurve(Data,positionX,positionY,Measures,Paper,'#FBB917', "WeightPercentile");
	drawPercentileCurve(Data,positionX,positionY,Measures,Paper,'#78a845', "HeadCircumferencePercentile");
}

function drawPercentileLine(positionX,positionY,height,width,percentile, Paper)
{
	var St = Paper.set();
	St.push(
	CircleStart = Paper.circle(positionX,positionY+height-percentile*(height/100),2),
	CircleEnd = Paper.circle(width, positionY+height-percentile*(height/100),2)
	)
	St.attr("fill","black");
	St.attr('opacity',0.3);
	var PercentileLine = Paper.path("M"+positionX+","+(positionY+height-percentile*(height/100))+", H"+(width)+"");
	if (percentile>9)
	{
		var TextStart  = Paper.text(positionX+10, positionY+height-percentile*(height/100)+5, percentile);
		var TextEnd = Paper.text(width-10, positionY+height-percentile*(height/100)+5, percentile);
	}
	else
	{
		var TextStart  = Paper.text(positionX+10, positionY+height-percentile*(height/100)+5, "0"+percentile);
		var TextEnd = Paper.text(width-10, positionY+height-percentile*(height/100)+5, "0"+percentile);
	}
	PercentileLine.attr('stroke-opacity',0.3);
	return PercentileLine;
}

function stepOverMissingData(Temp, Paper, Measures, positionX, Percentiles, color, i, dataType)
{
	if (i < Measures.numberOfButtons)
	{
		var tempStep = Measures.step;
	}
	else
	{
		var tempStep = Measures.bigStep;
	}
	var h = 0;
	var j = i;
	while (Percentiles[j+1][dataType] == GC.NODATA)
	{
		if (i < Measures.numberOfButtons)
		{
			tempStep = Measures.step + tempStep;
		}
		else
		{
			tempStep = Measures.bigStep + tempStep
		}
		if (i+1 == Measures.numberOfButtons)
		{
			tempStep = Measures.bigStep + tempStep - Measures.step;
		}
		h++;
		j++;
	}
	
	Temp = drawGrowthLine(Paper, positionX+i*Measures.step, Temp, Percentiles[i+1+h][dataType]-Percentiles[i][dataType],tempStep,color,Measures.scale);
	j = i;
	while (Percentiles[j+1][dataType] == GC.NODATA)
	{
		i++;
		j++;
	}
	var Data = new Array;
	Data.push(i,Temp);
	return Data
}

function drawPercentileCurve(Percentiles,positionX,positionY,Measures,Paper,color, dataType)
{
var i = 0;
var Temp = null;
	for (; i<Measures.numberOfButtons; i++)
		{
			if (i == 0)
			{
				if (Percentiles[i+1][dataType] == GC.NODATA)
				{
					Temp = positionY+Measures.scale*100-Measures.scale*Percentiles[i][dataType];
					var Data = new Array;
					Data = stepOverMissingData(Temp, Paper, Measures, positionX, Percentiles, color, i, dataType);
					i = Data[0];
					Temp = Data[1];
					delete Data;
				}
				else
				{
					Temp = drawGrowthLine(Paper, positionX, positionY+Measures.scale*100-Measures.scale*Percentiles[i][dataType], Percentiles[i+1][dataType]-Percentiles[i][dataType], Measures.step,color,Measures.scale);
				}
			}
			else if (Percentiles[i+1][dataType] == GC.NODATA)
			{
					var Data = new Array;
					Data = stepOverMissingData(Temp, Paper, Measures, positionX, Percentiles, color, i, dataType);
					i = Data[0];
					Temp = Data[1];
					delete Data;
			}
			else if (Percentiles[i+1] != null)
			{
				Temp = drawGrowthLine(Paper, positionX+i*Measures.step, Temp, Percentiles[i+1][dataType]-Percentiles[i][dataType],Measures.step,color,Measures.scale);
			}
			
		
		}
		for (; i<Measures.numberOfButtons+3;i++)
		{
			if (i == Measures.numberOfButtons)
			{
				if (Percentiles[i+1][dataType] == GC.NODATA)
				{
					//Temp = positionY+Measures.scale*100-Measures.scale*Percentiles[i][dataType];
					var Data = new Array;
					Data = stepOverMissingData(Temp, Paper, Measures, positionX, Percentiles, color, i, dataType);
					i = Data[0];
					Temp = Data[1];
					delete Data;
				}
				else
				{
					Temp = drawGrowthLine(Paper, positionX+i*Measures.step, Temp, Percentiles[i+1][dataType]-Percentiles[i][dataType],Measures.bigStep,color,Measures.scale);
				}
			}
			else if (Percentiles[i+1][dataType] == GC.NODATA)
			{
				var Data = new Array;
					Data = stepOverMissingData(Temp, Paper, Measures, positionX, Percentiles, color, i, dataType);
					i = Data[0];
					Temp = Data[1];
					delete Data;
			}
			else if (Percentiles[i+1] != null)
			{
				Temp = drawGrowthLine(Paper, positionX+Measures.step*(Measures.numberOfButtons) + (i-Measures.numberOfButtons)*Measures.bigStep, Temp, Percentiles[i+1][dataType] - Percentiles[i][dataType], Measures.bigStep, color,Measures.scale)
			}
		}
}


function drawGrowthLine(Paper, positionX,positionY, percentile, step,color, scale)
{
	var Line = Paper.path("M"+positionX+","+positionY+",l"+step+","+(-percentile*scale)+"");
	Line.attr('stroke',color);
	var circle = Paper.circle(positionX,positionY,2);
	circle.attr('fill',color);
	circle.attr('stroke',color);
	return positionY-(scale*percentile);
}

function setSelectedLineOnChart(Lines, code)
{
	for (j = 0; j<Lines.length; j++)
		{
			if (j != code)
			{
				Lines[j].attr('stroke-opacity', 0.3);
			}
			else
			{
				Lines[j].attr('stroke-opacity', 1.0);
			}
	}
}

function drawShadows(Shadows, Labels)
{
	Shadows.Length.attr({x: (Labels.Length.attr('x'))+2,y:(Labels.Length.attr('y'))+2 , fill:'black',opacity:0.3})
	Shadows.Weight.attr({x: (Labels.Weight.attr('x'))+2,y:(Labels.Weight.attr('y'))+2 , fill:'black',opacity:0.3})
	Shadows.HeadCircumference.attr({x: (Labels.HeadCircumference.attr('x'))+2,y:(Labels.HeadCircumference.attr('y'))+2 , fill:'black',opacity:0.3})
}

function refreshPercentileBorders(code, type)
{
	if (type == "LengthPercentile")
	{
		var Percentile = GC.ArcPercentilesLength;
	}
	if (type == "WeightPercentile")
	{
		var Percentile = GC.ArcPercentilesWeight;
	}
	if (type == "HeadCircumferencePercentile")
	{
		var Percentile = GC.ArcPercentilesHeadCircumference;
	}
	var Data = GC.Data;
	
	for (i = 0; i<Percentile.length; i++)
	{
		var anim = Raphael.animation({"stroke-opacity": 0.0},500);
			Percentile[i].animate(anim);
	}
	
	if (Data[code][type] < 3)
	{
		for (i = 0; i<Percentile.length; i++)
		{
			var anim = Raphael.animation({"stroke-opacity": 1.0},500);
			Percentile[i].animate(anim);
		}
	}
	if (Data[code][type] < 15)
	{
		for (i = 1; i<Percentile.length; i++)
		{
			var anim = Raphael.animation({"stroke-opacity": 1.0},500);
			Percentile[i].animate(anim);
		}
	}
	if (Data[code][type] < 50)
	{
		for (i = 2; i<Percentile.length; i++)
		{
			var anim = Raphael.animation({"stroke-opacity": 1.0},500);
			Percentile[i].animate(anim);
		}
	}
	if (Data[code][type] < 85)
	{
		for (i = 3; i<Percentile.length; i++)
		{
			var anim = Raphael.animation({"stroke-opacity": 1.0},500);
			Percentile[i].animate(anim);
		}
	}
	if (Data[code][type] < 97)
	{
		for (i = 4; i<Percentile.length; i++)
		{
			var anim = Raphael.animation({"stroke-opacity": 1.0},500);
			Percentile[i].animate(anim);
		}
	}
}

function regenerateBasedOnAge(Paper, code, positionX, positionY, Lines, lineAlpha, Labels, scale,step,bigStep,Boxes,Texts,numberOfButtons, mode)
{
	var Data = GC.Data;
	var lineBeta = -10;
	var lineGamma = -10;
	
	guiSettings(Boxes, Texts, code);
	if (mode == "ParentView")
	{
		var AnimLength = Raphael.animation({r: (Data[code]["LengthPercentile"]*GC.pViewSettings.zoomArcs)/2},500,"bounce");
		var AnimWeight = Raphael.animation({r: (Data[code]["WeightPercentile"]*GC.pViewSettings.zoomArcs)/2},500,"bounce");
		var AnimHeadCircumference = Raphael.animation({r: (Data[code]["HeadCircumferencePercentile"]*GC.pViewSettings.zoomArcs)/2},500,"bounce");
		GC.ArcLength.animate(AnimLength);
		GC.ArcWeight.animate(AnimWeight);
		GC.ArcHeadCircumference.animate(AnimHeadCircumference);
		
		GC.LengthText.attr("text",(Data[code]["LengthPercentile"]+"%"));
		GC.WeightText.attr("text",(Data[code]["WeightPercentile"]+"%"));
		GC.HeadCircumferenceText.attr("text",(Data[code]["HeadCircumferencePercentile"]+"%"));
		
		refreshPercentileBorders(code, "LengthPercentile");
		refreshPercentileBorders(code, "WeightPercentile");
		refreshPercentileBorders(code, "HeadCircumferencePercentile");
		
		GC.LengthData.attr('text', (Math.round(Data[code]["LengthData"])+"cm"));
		GC.WeightData.attr('text', (Math.round(Data[code]["WeightData"])+"kg"));
		GC.HeadCircumferenceData.attr('text', (Math.round(Data[code]["HeadCircumferenceData"])+"cm"));
	}
	setSelectedLineOnChart(Lines, code);
	Labels.Length.show();
	Labels.Weight.show();
	Labels.HeadCircumference.show();
	if (code<13)
	{
		Labels.Length.moveTooltip(positionX+code*step, positionY+scale*100-scale*Data[code]["LengthPercentile"]);
		Labels.Weight.moveTooltip(positionX+code*step, positionY+scale*100-scale*Data[code]["WeightPercentile"]);
		Labels.HeadCircumference.moveTooltip(positionX+code*step, positionY+scale*100-scale*Data[code]["HeadCircumferencePercentile"]);
		Labels.Length.moveVertically(positionX+code*step, positionY+scale*100-scale*Data[code]["LengthPercentile"],45);
		Labels.Weight.moveVertically(positionX+code*step, positionY+scale*100-scale*Data[code]["WeightPercentile"],90);
		Labels.HeadCircumference.moveVertically(positionX+code*step, positionY+scale*100-scale*Data[code]["HeadCircumferencePercentile"],135);
	}
	else
	{
		Labels.Length.moveTooltip(positionX+13*step+(code-13)*bigStep, positionY+scale*100-scale*Data[code]["LengthPercentile"]);
		Labels.Weight.moveTooltip(positionX+13*step+(code-13)*bigStep, positionY+scale*100-scale*Data[code]["WeightPercentile"]);
		Labels.HeadCircumference.moveTooltip(positionX+13*step+(code-13)*bigStep, positionY+scale*100-scale*Data[code]["HeadCircumferencePercentile"]);
		Labels.Length.moveVertically(positionX+13*step+(code-13)*bigStep, positionY+scale*100-scale*Data[code]["LengthPercentile"],45);
		Labels.Weight.moveVertically(positionX+13*step+(code-13)*bigStep, positionY+scale*100-scale*Data[code]["WeightPercentile"],90);
		Labels.HeadCircumference.moveVertically(positionX+13*step+(code-13)*bigStep, positionY+scale*100-scale*Data[code]["HeadCircumferencePercentile"],135);
	}
	Labels.Length.setText(Data[code]["LengthPercentile"]);
	Labels.Weight.setText(Data[code]["WeightPercentile"]);
	Labels.HeadCircumference.setText(Data[code]["HeadCircumferencePercentile"]);
	/*
	if (Data[code]["LengthPercentile"] == Data[code]["WeightPercentile"] & Data[code]["WeightPercentile"] == Data[code]["HeadCircumferencePercentile"])
	{
		if (Data[code]["LengthPercentile"]<=20)
		{
			lineAlpha = -80;
			lineBeta  = -55;
			lineGamma = -30;
		}
		else if (Data[code]["LengthPercentile"]>20 & Data[code]["LengthPercentile"]<80)
		{
			lineAlpha = -25;
			lineBeta  = 0;
			lineGamma = 25;
		}
		else if (Data[code]["LengthPercentile"]>=80)
		{
			lineAlpha = 25;
			lineBeta  = 0;
			lineGamma = 50;
		}
	}
	
	else
	{
	if (Data[code]["LengthPercentile"] > 90)
	{
		lineAlpha = 10;
	}
	if (Data[code]["WeightPercentile"] > 90)
	{	
		lineBeta = 10;
	}
	if (Data[code]["HeadCircumferencePercentile"] > 90)
	{
		lineGamma = 10;
	}
	}
	showLabels(Arrows, Labels, TextsLabel	, code, step, bigStep, numberOfButtons, lineAlpha,lineBeta,lineGamma, positionX, positionY, scale, Data, mode);
	drawShadows(Shadows, Labels);
	HideLabels(Data, Labels, Shadows, TextsLabel, Arrows, code);*/
	
}

function moveLabelsOnMain(code, Arrows, Labels, TextsLabel, positionX, positionY, scale, step, bigStep, numberOfButtons, lineAlpha)
{
	var Data = GC.Data;
	var top = 60;
	var middle = 100;
	var bottom = 140;
	if (Data[code]["LengthPercentile"] >= Data[code]["WeightPercentile"] & Data[code]["LengthPercentile"] >= Data[code]["HeadCircumferencePercentile"])
	{
		if (Data[code]["WeightPercentile"] >= Data[code]["HeadCircumferencePercentile"])
		{
			setLabelsPosition(Labels, TextsLabel, top, middle, bottom);
			moveArrowsOnMain(Arrows, code, Data, numberOfButtons, "LengthPercentile", positionX, positionY, lineAlpha, step, scale, bigStep, top);
			moveArrowsOnMain(Arrows, code, Data, numberOfButtons, "WeightPercentile", positionX, positionY, lineAlpha, step, scale, bigStep, middle);
			moveArrowsOnMain(Arrows, code, Data, numberOfButtons, "HeadCircumferencePercentile", positionX, positionY, lineAlpha, step, scale, bigStep, bottom);
		}
		else
		{
			setLabelsPosition(Labels, TextsLabel, top, bottom, middle);
			moveArrowsOnMain(Arrows, code, Data, numberOfButtons, "LengthPercentile", positionX, positionY, lineAlpha, step, scale, bigStep, top);
			moveArrowsOnMain(Arrows, code, Data, numberOfButtons, "WeightPercentile", positionX, positionY, lineAlpha, step, scale, bigStep, bottom);
			moveArrowsOnMain(Arrows, code, Data, numberOfButtons, "HeadCircumferencePercentile", positionX, positionY, lineAlpha, step, scale, bigStep, middle);
		}
	}
	else if (Data[code]["WeightPercentile"] >= Data[code]["LengthPercentile"] & Data[code]["WeightPercentile"] >= Data[code]["HeadCircumferencePercentile"])
	{
		if (Data[code]["LengthPercentile"] >= Data[code]["HeadCircumferencePercentile"])
		{
			setLabelsPosition(Labels, TextsLabel, middle, top, bottom);
			moveArrowsOnMain(Arrows, code, Data, numberOfButtons, "LengthPercentile", positionX, positionY, lineAlpha, step, scale, bigStep, middle);
			moveArrowsOnMain(Arrows, code, Data, numberOfButtons, "WeightPercentile", positionX, positionY, lineAlpha, step, scale, bigStep, top);
			moveArrowsOnMain(Arrows, code, Data, numberOfButtons, "HeadCircumferencePercentile", positionX, positionY, lineAlpha, step, scale, bigStep, bottom);
		}
		else
		{	
			setLabelsPosition(Labels, TextsLabel, bottom, top, middle);
			moveArrowsOnMain(Arrows, code, Data, numberOfButtons, "LengthPercentile", positionX, positionY, lineAlpha, step, scale, bigStep, bottom);
			moveArrowsOnMain(Arrows, code, Data, numberOfButtons, "WeightPercentile", positionX, positionY, lineAlpha, step, scale, bigStep, top);
			moveArrowsOnMain(Arrows, code, Data, numberOfButtons, "HeadCircumferencePercentile", positionX, positionY, lineAlpha, step, scale, bigStep, middle);
		}
	}
	else if (Data[code]["HeadCircumferencePercentile"] >= Data[code]["WeightPercentile"] & Data[code]["HeadCircumferencePercentile"] > Data[code]["LengthPercentile"])
	{
		if (Data[code]["WeightPercentile"] >= Data[code]["LengthPercentile"])
		{
			setLabelsPosition(Labels, TextsLabel, bottom, middle, top);
			moveArrowsOnMain(Arrows, code, Data, numberOfButtons, "LengthPercentile", positionX, positionY, lineAlpha, step, scale, bigStep, bottom);
			moveArrowsOnMain(Arrows, code, Data, numberOfButtons, "WeightPercentile", positionX, positionY, lineAlpha, step, scale, bigStep, middle);
			moveArrowsOnMain(Arrows, code, Data, numberOfButtons, "HeadCircumferencePercentile", positionX, positionY, lineAlpha, step, scale, bigStep, top);
		}
		else
		{
			setLabelsPosition(Labels, TextsLabel, middle, bottom, top);
			moveArrowsOnMain(Arrows, code, Data, numberOfButtons, "LengthPercentile", positionX, positionY, lineAlpha, step, scale, bigStep, middle);
			moveArrowsOnMain(Arrows, code, Data, numberOfButtons, "WeightPercentile", positionX, positionY, lineAlpha, step, scale, bigStep, bottom);
			moveArrowsOnMain(Arrows, code, Data, numberOfButtons, "HeadCircumferencePercentile", positionX, positionY, lineAlpha, step, scale, bigStep, top);
		}
	}
}

function setLabelsPosition(Labels, TextsLabel, moveLength, moveWeight, moveHeadCircumference)
{
	Labels.Length.attr('y', moveLength);
	TextsLabel.Length.attr('y', moveLength+10);
	Labels.Weight.attr('y', moveWeight);
	TextsLabel.Weight.attr('y', moveWeight+10);
	Labels.HeadCircumference.attr('y', moveHeadCircumference);
	TextsLabel.HeadCircumference.attr('y', moveHeadCircumference+10);
}

function moveArrowsOnMain(Arrows, code, Data, numberOfButtons, Type, positionX, positionY, lineAlpha, step, scale, bigStep, verticalStep)

{
	if (code<=numberOfButtons)
	{
		var AnimateWeightOverlapping = Raphael.animation({path: ("m"+(positionX+(code)*step)+","+(positionY+scale*100-scale*Data[code][Type])+", L"+(code*step + 2.6*step)+","+(verticalStep)+", v20,z")});
	}
	else
	{
		var	AnimateWeightOverlapping = Raphael.animation({path: ("m"+(positionX+(code-numberOfButtons)*bigStep+numberOfButtons*step)+","+(positionY+scale*100-scale*Data[code][Type])+", L"+(13*step+(code-13)*bigStep+2.6*step)+","+(verticalStep)+", v20,z")});
	}
	switch (Type)
	{
		case "LengthPercentile":
			Arrows.Length.animate(AnimateWeightOverlapping);
		case "WeightPercentile":
			Arrows.Weight.animate(AnimateWeightOverlapping);
		case "HeadCircumferencePercentile":
			Arrows.HeadCircumference.animate(AnimateWeightOverlapping);
	}
	
}

function HideLabels(Data, Labels, Shadows, TextsLabel, Arrows, code)
{
	if (Data[code]["HeadCircumferencePercentile"] == GC.NODATA)
	{
		Labels.HeadCircumference.attr('opacity',0.0);
		Shadows.HeadCircumference.attr('opacity',0.0);
		TextsLabel.HeadCircumference.attr('opacity',0.0);
		Arrows.HeadCircumference.attr('opacity',0.0);
	}
	if (Data[code]["LengthPercentile"] == GC.NODATA)
	{
		Labels.Length.attr('opacity',0.0);
		Shadows.Length.attr('opacity',0.0);
		TextsLabel.Length.attr('opacity',0.0);
		Arrows.Length.attr('opacity',0.0);
	}
	if (Data[code]["WeightPercentile"] == GC.NODATA)
	{
		Labels.Weight.attr('opacity',0.0);
		Shadows.Weight.attr('opacity',0.0);
		TextsLabel.Weight.attr('opacity',0.0);
		Arrows.Weight.attr('opacity',0.0);
	}
}

function guiSettings(Boxes, Texts, code)
{
	Boxes[code].toBack();
	for (i = 0; i<16;i++)
	{
		if (i!=code)
		{
			Boxes[i].toFront()
		}
	}
	Texts[code].attr('fill', 'white');
	Texts[code].attr('font-weight','900');
	Boxes[code].attr('opacity',0.8);
	for (k = 0; k<16; k++)
	{
		if (k!=code)
		{
			Boxes[k].attr('opacity',0.1);
			Texts[k].attr('fill', 'black');
			Texts[code].attr('font-weight','normal');
		}
	}
}

function IsOverlapping(Rectangle1, Rectangle2)
{	
	for (i=0; i<Rectangle1.attr('height')+1; i++)
	{
		if (Math.floor(Rectangle1.attr('y')+i) == Math.floor(Rectangle2.attr('y')) || Math.floor(Rectangle1.attr('y')-i) == Math.floor(Rectangle2.attr('y')))
		{
			return true;
		}
	}
	return false;
}

function setBoxes(Paper, positionX, positionY, Lines, lineAlpha, Labels, scale,step,bigStep,Boxes,Texts, numberOfButtons,
	Colors, code, mode)
{
	Boxes[code].mouseover(function(){Boxes[code].attr('fill',Colors.Over);});
	Boxes[code].mouseout (function(){Boxes[code].attr('fill',Colors.Off);});
	Boxes[code].mousedown (function(){Boxes[code].attr('fill',Colors.Pressed);});
	Boxes[code].mouseup (function(){Boxes[code].attr('fill',Colors.Over);});
	Boxes[code].click(function(){
	regenerateBasedOnAge(Paper, code, positionX, positionY, Lines, lineAlpha, Labels, scale,step,bigStep,Boxes,Texts, numberOfButtons, mode);
	});
}

function moveLabels(code, Labels, TextsLabel, positionX, positionY, scale, step, bigStep,numberOfButtons, lineAlpha)
{
    var Data = GC.Data;

	if (Data[code]["LengthPercentile"] >= Data[code]["WeightPercentile"] & Data[code]["LengthPercentile"] >= Data[code]["HeadCircumferencePercentile"])
		{	
			var i = 1;
			if (Data[code]["WeightPercentile"] >= Data[code]["HeadCircumferencePercentile"])
			{
				if (IsOverlapping(Labels.Length, Labels.Weight))
				{
				Labels.Weight.attr('y', Labels.Weight.attr('y')+45);
				TextsLabel.Weight.attr('y', TextsLabel.Weight.attr('y')+45);
				if (code<=numberOfButtons)
				{
					var AnimateWeightOverlapping = Raphael.animation({path: ("m"+(positionX+(code)*step)+","+(positionY+scale*100-scale*Data[code]["WeightPercentile"])+", l20,"+(lineAlpha+45)+", v20,z")});
				}
				else
				{
					var	AnimateWeightOverlapping = Raphael.animation({path: ("m"+(positionX+(code-numberOfButtons)*bigStep+numberOfButtons*step)+","+(positionY+scale*100-scale*Data[code]["WeightPercentile"])+", l20,"+(lineAlpha+45)+", v20,z")});
				}
				Arrows.Weight.animate(AnimateWeightOverlapping);
				i = 2;
				}
				if (IsOverlapping(Labels.HeadCircumference,Labels.Weight) || IsOverlapping(Labels.HeadCircumference,Labels.Length))
				{
					Labels.HeadCircumference.attr('y', Labels.HeadCircumference.attr('y')+i*45);
					TextsLabel.HeadCircumference.attr('y', TextsLabel.HeadCircumference.attr('y')+i*45);
					if (code<=numberOfButtons)
					{
						var AnimateHeadCircumferenceOverlapping = Raphael.animation({path: ("m"+(positionX+(code)*step)+","+(positionY+scale*100-scale*Data[code]["HeadCircumferencePercentile"])+", l20,"+(lineAlpha+i*45)+", v20,z")});
					}
					else
					{
						var AnimateHeadCircumferenceOverlapping = Raphael.animation({path: ("m"+(positionX+(code-numberOfButtons)*bigStep+numberOfButtons*step)+","+(positionY+scale*100-scale*Data[code]["HeadCircumferencePercentile"])+", l20,"+(lineAlpha+i*45)+", v20,z")});
					}
					Arrows.HeadCircumference.animate(AnimateHeadCircumferenceOverlapping);
				}
			}
			else
			{
				if (IsOverlapping(Labels.Length, Labels.HeadCircumference))
				{
				Labels.HeadCircumference.attr('y', Labels.HeadCircumference.attr('y')+45);
				TextsLabel.HeadCircumference.attr('y', TextsLabel.HeadCircumference.attr('y')+45);
				if (code <= numberOfButtons)
				{
					var AnimateHeadCircumferenceOverlapping = Raphael.animation({path: ("m"+(positionX+(code)*step)+","+(positionY+scale*100-scale*Data[code]["HeadCircumferencePercentile"])+", l20,"+(lineAlpha+45)+", v20,z")});
				}
				else
				{
					
					var AnimateHeadCircumferenceOverlapping = Raphael.animation({path: ("m"+(positionX+(code-numberOfButtons)*bigStep+numberOfButtons*step)+","+(positionY+scale*100-scale*Data[code]["HeadCircumferencePercentile"])+", l20,"+(lineAlpha+45)+", v20,z")});
				}
				Arrows.HeadCircumference.animate(AnimateHeadCircumferenceOverlapping);
				i = 2;
				}
				if (IsOverlapping(Labels.HeadCircumference,Labels.Weight) || IsOverlapping(Labels.Weight,Labels.Length))
				{
					Labels.Weight.attr('y', Labels.Weight.attr('y')+i*45);
					TextsLabel.Weight.attr('y', TextsLabel.Weight.attr('y')+i*45);
					if (code<= numberOfButtons)
					{
						var AnimateWeightOverlapping = Raphael.animation({path: ("m"+(positionX+(code)*step)+","+(positionY+scale*100-scale*Data[code]["WeightPercentile"])+", l20,"+(lineAlpha+i*45)+", v20,z")});
					}
					else
					{
						var AnimateWeightOverlapping = Raphael.animation({path: ("m"+(positionX+(code-numberOfButtons)*bigStep+numberOfButtons*step)+","+(positionY+scale*100-scale*Data[code]["WeightPercentile"])+", l20,"+(lineAlpha+i*45)+", v20,z")});
					}
					Arrows.Weight.animate(AnimateWeightOverlapping);
				}
			}
		}
		
		//Weight >= (Head, Length)
	if(Data[code]["WeightPercentile"] >= Data[code]["LengthPercentile"] & Data[code]["WeightPercentile"] >= Data[code]["HeadCircumferencePercentile"])
		{
			var i = 1;
			if (Data[code]["HeadCircumferencePercentile"] >= Data[code]["LengthPercentile"])
			{
				if (IsOverlapping(Labels.Weight,Labels.HeadCircumference))
				{
					Labels.HeadCircumference.attr('y', Labels.HeadCircumference.attr('y')+i*45);
					TextsLabel.HeadCircumference.attr('y', TextsLabel.HeadCircumference.attr('y')+i*45);
					if (code <= numberOfButtons)
					{
						var AnimateHeadCircumferenceOverlapping = Raphael.animation({path: ("m"+(positionX+(code)*step)+","+(positionY+scale*100-scale*Data[code]["HeadCircumferencePercentile"])+", l20,"+(lineAlpha+i*45)+", v20,z")});
					}
					else
					{
						var AnimateHeadCircumferenceOverlapping = Raphael.animation({path: ("m"+(positionX+(code-numberOfButtons)*bigStep+numberOfButtons*step)+","+(positionY+scale*100-scale*Data[code]["HeadCircumferencePercentile"])+", l20,"+(lineAlpha+i*45)+", v20,z")});
					}
					Arrows.HeadCircumference.animate(AnimateHeadCircumferenceOverlapping);
					i = 2;
				}
				if (IsOverlapping(Labels.HeadCircumference,Labels.Length) || IsOverlapping(Labels.Length, Labels.Weight))
				{
					Labels.Length.attr('y', Labels.Length.attr('y')+i*45);
					TextsLabel.Length.attr('y', TextsLabel.Length.attr('y')+i*45);
					if (code <= numberOfButtons)
					{
						var AnimateLengthOverlapping = Raphael.animation({path: ("m"+(positionX+(code)*step)+","+(positionY+scale*100-scale*Data[code]["LengthPercentile"])+", l20,"+(lineAlpha+i*45)+", v20,z")});
					}
					else
					{
						var AnimateLengthOverlapping = Raphael.animation({path: ("m"+(positionX+(code-numberOfButtons)*bigStep+numberOfButtons*step)+","+(positionY+scale*100-scale*Data[code]["LengthPercentile"])+", l20,"+(lineAlpha+i*45)+", v20,z")});
					}
					Arrows.Length.animate(AnimateLengthOverlapping);
				}
			}
			else
			i = 1;
			{
				if (IsOverlapping(Labels.Weight,Labels.Length))
				{
					Labels.Length.attr('y', Labels.Length.attr('y')+45);
					TextsLabel.Length.attr('y', TextsLabel.Length.attr('y')+45);
					if (code <= numberOfButtons)
					{
						var AnimateLengthOverlapping = Raphael.animation({path: ("m"+(positionX+(code)*step)+","+(positionY+scale*100-scale*Data[code]["LengthPercentile"])+", l20,"+(lineAlpha+45)+", v20,z")});
					}
					else
					{
						var AnimateLengthOverlapping = Raphael.animation({path: ("m"+(positionX+(code-numberOfButtons)*bigStep+numberOfButtons*step)+","+(positionY+scale*100-scale*Data[code]["LengthPercentile"])+", l20,"+(lineAlpha+45)+", v20,z")});
					}
					Arrows.Length.animate(AnimateLengthOverlapping);
					i = 2;
				}
				if (IsOverlapping(Labels.Weight,Labels.HeadCircumference) || IsOverlapping(Labels.Length, Labels.HeadCircumference))
				{
					Labels.HeadCircumference.attr('y', Labels.HeadCircumference.attr('y')+i*45);
					TextsLabel.HeadCircumference.attr('y', TextsLabel.HeadCircumference.attr('y')+i*45);
					if (code <= numberOfButtons)
					{
						var AnimateHeadCircumferenceOverlapping = Raphael.animation({path: ("m"+(positionX+(code)*step)+","+(positionY+scale*100-scale*Data[code]["HeadCircumferencePercentile"])+", l20,"+(lineAlpha+i*45)+", v20,z")});
					}
					else
					{
						var AnimateHeadCircumferenceOverlapping = Raphael.animation({path: ("m"+(positionX+(code-numberOfButtons)*bigStep+numberOfButtons*step)+","+(positionY+scale*100-scale*Data[code]["HeadCircumferencePercentile"])+", l20,"+(lineAlpha+i*45)+", v20,z")});
					}
					Arrows.HeadCircumference.animate(AnimateHeadCircumferenceOverlapping);
				}
			}
		}
		
		//Head >= (Weight, Length)
	if(Data[code]["HeadCircumferencePercentile"] >= Data[code]["WeightPercentile"] & Data[code]["HeadCircumferencePercentile"] > Data[code]["LengthPercentile"])
		{
			var i = 1;
			if (Data[code]["LengthPercentile"] >= Data[code]["WeightPercentile"])
			{
				if (IsOverlapping(Labels.HeadCircumference, Labels.Length))
				{
					Labels.Length.attr('y', Labels.Length.attr('y')+i*45);
					TextsLabel.Length.attr('y', TextsLabel.Length.attr('y')+i*45);
					if (code <= numberOfButtons)
					{
						var AnimateLengthOverlapping = Raphael.animation({path: ("m"+(positionX+(code)*step)+","+(positionY+scale*100-scale*Data[code]["LengthPercentile"])+", l20,"+(lineAlpha+i*45)+", v20,z")});
					}
					else
					{
						var AnimateLengthOverlapping = Raphael.animation({path: ("m"+(positionX+(code-numberOfButtons)*bigStep+numberOfButtons*step)+","+(positionY+scale*100-scale*Data[code]["LengthPercentile"])+", l20,"+(lineAlpha+i*45)+", v20,z")});
					}
					Arrows.Length.animate(AnimateLengthOverlapping);
					i = 2;
				}
				if (IsOverlapping(Labels.Length,Labels.Weight) || IsOverlapping(Labels.HeadCircumference, Labels.Weight))
				{
					Labels.Weight.attr('y', Labels.Weight.attr('y')+i*45);
					TextsLabel.Weight.attr('y', TextsLabel.Weight.attr('y')+i*45);
					if (code <= numberOfButtons)
					{
						var AnimateWeightOverlapping = Raphael.animation({path: ("m"+(positionX+(code)*step)+","+(positionY+scale*100-scale*Data[code]["WeightPercentile"])+", l20,"+(lineAlpha+i*45)+", v20,z")});
					}
					else
					{
						var AnimateWeightOverlapping = Raphael.animation({path: ("m"+(positionX+(code-numberOfButtons)*bigStep+numberOfButtons*step)+","+(positionY+scale*100-scale*Data[code]["WeightPercentile"])+", l20,"+(lineAlpha+i*45)+", v20,z")});
					}
					Arrows.Weight.animate(AnimateWeightOverlapping);
					i = 2;
				}
			}
			else
			{
				if (IsOverlapping(Labels.HeadCircumference, Labels.Weight))
				{
					Labels.Weight.attr('y', Labels.Weight.attr('y')+i*45);
					TextsLabel.Weight.attr('y', TextsLabel.Weight.attr('y')+i*45);
					if (code <= numberOfButtons)
					{
						var AnimateWeightOverlapping = Raphael.animation({path: ("m"+(positionX+(code)*step)+","+(positionY+scale*100-scale*Data[code]["WeightPercentile"])+", l20,"+(lineAlpha+i*45)+", v20,z")});
					}
					else
					{
						var AnimateWeightOverlapping = Raphael.animation({path: ("m"+(positionX+(code-numberOfButtons)*bigStep+numberOfButtons*step)+","+(positionY+scale*100-scale*Data[code]["WeightPercentile"])+", l20,"+(lineAlpha+i*65)+", v20,z")});
					}
					Arrows.Weight.animate(AnimateWeightOverlapping);
					i = 2;
				}
				if (IsOverlapping(Labels.Length,Labels.Weight) || IsOverlapping(Labels.HeadCircumference, Labels.Length))
				{
					Labels.Length.attr('y', Labels.Length.attr('y')+i*45);
					TextsLabel.Length.attr('y', TextsLabel.Length.attr('y')+i*45);
					if (code <= numberOfButtons)
					{
						AnimateLengthOverlapping = Raphael.animation({path: ("m"+(positionX+(code)*step)+","+(positionY+scale*100-scale*Data[code]["LengthPercentile"])+", l20,"+(lineAlpha+i*45)+", v20,z")});
					}
					else
					{
						AnimateLengthOverlapping = Raphael.animation({path: ("m"+(positionX+(code-numberOfButtons)*bigStep+numberOfButtons*step)+","+(positionY+scale*100-scale*Data[code]["LengthPercentile"])+", l20,"+(lineAlpha+i*45)+", v20,z")});
					}
					Arrows.Length.animate(AnimateLengthOverlapping);
				}
			}
		}

}

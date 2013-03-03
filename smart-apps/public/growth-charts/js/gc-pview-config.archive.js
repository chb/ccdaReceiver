//DATAFILE
//Here's where the fun begins
	
GC = window.GC || {};

function setData(patient)
{
	//return;
	var Patient = {
		gender    : patient.gender, 
		birthdate : patient.birthdate
	};
	
	var Data = new Array();
	var L = 50, W = 3.5, H = 35;
	for (i = 0; i<17; i++)
	{
		L += 1.2*Math.random();   
		W += 1.2*Math.random();
		H += 1.2*Math.random();
		
		if (!patient.data.length[i]) {
			patient.data.length[i] = { value : L, agemos : i };
		}
		if (patient.data.length[i].value == null) {
			patient.data.length[i].value = 0;
		}
		
		if (!patient.data.weight[i]) {
			patient.data.weight[i] = { value : W, agemos : i };
		}
		if (patient.data.weight[i].value == null) {
			patient.data.weight[i].value = 0;
		}
		
		if (!patient.data.headc[i]) {
			patient.data.headc[i] = { value : H, agemos: i };
		}
		if (patient.data.headc[i].value == null) {
			patient.data.headc[i].value = 0;
		}
		/*if (patient.data.length[0].value == null)
		{
			patient.data.length[0].value = 0;
		}
		if (patient.data.weight[0].value == null)
		{
			patient.data.weight[0].value = 0;
		}
		if (patient.data.headc[0].value == null)
		{
			patient.data.headc[0].value = 0;
		}*/
		if (i != 5)
		{
			Data.push({
				"LengthData": patient.data.length[i].value, 
				"WeightData": patient.data.weight[i].value, 
				"HeadCircumferenceData": patient.data.headc[i].value, 
				"age": i
			});
		}
		else
		{
			Data.push({
				"LengthData": null, 
				"WeightData": patient.data.weight[i].value, 
				"HeadCircumferenceData": patient.data.headc[i].value, 
				"age": i
			});			
		}
	}
	
	GC.Data = Data;
	
	for (var i = 0; i < Data.length; i++) {
		var bDay = new XDate(patient.birthdate);
		if (i < 13)
		{
			var currentDate = new XDate(bDay.clone().addWeeks(i));
			var agemos = bDay.diffMonths(currentDate);
			//alert(agemos);
		}
		else
		{
			var currentDate = new XDate(bDay.clone().addWeeks(12));
			currentDate.addMonths(i-12);
			var agemos = bDay.diffMonths(currentDate);
			//alert(agemos);
		}
        setPercentiles(Patient["gender"], Data[i], agemos);        
    }

    function setPercentiles(gender, data, agemos) {
        if (!data["LengthData"]) {
            data["LengthPercentile"] = GC.NODATA;
        } else {
            data["LengthPercentile"] = Math.round(10000*GC.findPercentileFromX (data["LengthData"], GC.DATA_SETS.CDC_STATURE, gender, agemos))/100;
        }
        
        if (!data["WeightData"]) {
            data["WeightPercentile"] = GC.NODATA;
        } else {
            data["WeightPercentile"] = Math.round(10000*GC.findPercentileFromX (data["WeightData"], GC.DATA_SETS.CDC_WEIGHT, gender, agemos))/100;
        }
        
        if (!data["HeadCircumferenceData"]) {
            data["HeadCircumferencePercentile"] = GC.NODATA;
        } else {
            data["HeadCircumferencePercentile"] = Math.round(10000*GC.findPercentileFromX (data["HeadCircumferenceData"], GC.DATA_SETS["CDC_HEAD_CIRCUMFERENCE_INF"], gender, agemos))/100;
        }
    }
    
    // NJS 2012-12-08: Temporary fix for the incorrect assumptions of the code above
    var length = patient.data.length[patient.data.length.length-1].value;
    var length_age = patient.data.length[patient.data.length.length-1].agemos;
    var weight = patient.data.weight[patient.data.weight.length-1].value;
    var weight_age = patient.data.weight[patient.data.weight.length-1].agemos;
    var headc = patient.data.headc[patient.data.headc.length-1].value;
    var headc_age = patient.data.headc[patient.data.headc.length-1].agemos;
    var gender = Patient["gender"];
    GC.Data=[{"LengthPercentile": Math.round(10000*GC.findPercentileFromX (length, GC.DATA_SETS.CDC_STATURE, gender, length_age))/100,
		   "WeightPercentile": Math.round(10000*GC.findPercentileFromX (weight, GC.DATA_SETS.CDC_WEIGHT, gender, weight_age))/100,
		   "HeadCircumferencePercentile": Math.round(10000*GC.findPercentileFromX (headc, GC.DATA_SETS["CDC_HEAD_CIRCUMFERENCE_INF"], gender, headc_age))/100}];
}

(function () {
    "use strict";
    var CurrentPatient = GC.samplePatient;
    var windowWidth = document.documentElement.clientWidth;
    
    GC.pViewSettings = {
        windowWidth: windowWidth - 100,
        zoomArcs: windowWidth/1000
    };
	GC.NODATA = -999;
	
    /*var Data = [{"LengthData": 50, "WeightData": 3.5, "HeadCircumferenceData": 36, "age": 0},
                {"LengthData": 51, "WeightData": 3.8, "HeadCircumferenceData": 37, "age": 1},
                {"LengthData": 52, "WeightData": 3.9, "HeadCircumferenceData": 40, "age": 2},
                {"LengthData": 53, "WeightData": 6, "HeadCircumferenceData": 38, "age": 3},
                {"LengthData": 54, "WeightData": 6, "HeadCircumferenceData": 39, "age": 4},
                {"LengthData": 55, "WeightData": 6,"HeadCircumferenceData": 39, "age": 5},
                {"LengthData": 55, "WeightData": 6, "HeadCircumferenceData": 39, "age": 6},
                {"LengthData": 57, "WeightData": 6, "HeadCircumferenceData": 40, "age": 7},
                {"LengthData": 58, "WeightData": 6.5, "HeadCircumferenceData": 41, "age": 8},
                {"LengthData": 58, "WeightData": 6.5, "HeadCircumferenceData": 42, "age": 9},
                {"LengthData": 60, "WeightData": 6.7, "HeadCircumferenceData": 42, "age": 10},
                {"LengthData": 65, "WeightData": 7, "HeadCircumferenceData": 42, "age": 12},
                {"LengthData": 65, "WeightData": 8, "HeadCircumferenceData": 43, "age": 13},
                {"LengthData": 65,"WeightData": 9, "HeadCircumferenceData": 44, "age": 16},
                {"LengthData": 68, "WeightData": 9, "HeadCircumferenceData": 47, "age": 20},
                {"LengthData": 69, "WeightData": 9, "HeadCircumferenceData": 49, "age": 24},
                {"LengthData": 22, "WeightData": 9, "HeadCircumferenceData": 70, "age": 28}];*/
	
	
    /*for (var i = 0; i < Data.length; i++) {	
        setPercentiles(Patient["gender"], Data[i]);        
    }

    function setPercentiles(gender, data) {
        if (!data["LengthData"]) {
            data["LengthPercentile"] = GC.NODATA;
        } else {
            data["LengthPercentile"] = Math.round(10000*GC.findPercentileFromX (data["LengthData"], GC.DATA_SETS["CDC_LENGTH_INF"], gender, data["age"]/4))/100;
        }
        
        if (!data["WeightData"]) {
            data["WeightPercentile"] = GC.NODATA;
        } else {
            data["WeightPercentile"] = Math.round(10000*GC.findPercentileFromX (data["WeightData"], GC.DATA_SETS["CDC_WEIGHT_INF"], gender, data["age"]/4))/100;
        }
        
        if (!data["HeadCircumferenceData"]) {
            data["HeadCircumferencePercentile"] = GC.NODATA;
        } else {
            data["HeadCircumferencePercentile"] = Math.round(10000*GC.findPercentileFromX (data["HeadCircumferenceData"], GC.DATA_SETS["CDC_HEAD_CIRCUMFERENCE_INF"], gender, data["age"]/4))/100;
        }
    }*/

}());
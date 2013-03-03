// Growth Charts prototype
// Nikolai Schwertner, MedAppTech 

// Initialize the GC global object as needed
var GC;
if (!GC) {
    GC = {};
}

(function () {
    "use strict";
	
	var patient;
	
	GC.generateCurveSeries = function (dataSet, gender, percentile, startAge, endAge) {
        var data   = dataSet.data[gender],
            len    = data.length,
			points = [],
			i, age;
        
		for (i = 0; i < len; i++) {
            age = data[i].Agemos;
			
			if (dataSet.source == "FENTON") {
				//if (!patient) {
				//	patient = GC.App.getPatient();
				//}
				//if (!patient) {
				//	if (patient.gestationAge) {
				//		age += 3//Math.abs(patient.gestationAge);
				//	}
				//}
				//age = Math.max(0, age + 1);
			}
			
			// Limit in time if needed
			if ( dataSet.source != "FENTON" && (
				 ((startAge || startAge === 0) && age < startAge) || 
				 ((endAge   || endAge   === 0) && age > endAge) )) {
				continue;
			}
			
			if (dataSet.source == "FENTON") {
				//if (!patient) {
				//	patient = GC.App.getPatient();
				//}
				//if (!patient) {
				//	if (patient.gestationAge) {
				//		age -= patient.gestationAge;
				//	}
				//}
				//age = Math.max(0, age - 3);
				//console.log(age);
				//age += 1;
			}
			
            points.push({
				x: age, 
				y: GC.findXFromPercentile(percentile, dataSet, gender, age)
			});
        }
		
		return points;
    };
    
    GC.convertPointsSet = function ( dataPoints, startAge, endAge ) {
        var data = dataPoints,
            points = [],
            i, age;
        
        for (i = 0; i < data.length; i++) {
            age = data[i].Agemos;
			
			// Limit in time if needed
			if ( startAge && age < startAge || endAge && age > endAge) {
				continue;
			}
			
			points.push({
				x: age, 
				y: data[i].value
			});
        }
        
        return points.sort(function(a,b) {
                return a.x - b.x;
        });
    };

}());
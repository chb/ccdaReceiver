/*global Chart, GC, PointSet, strPad, weeks2months, Raphael, XDate, console,
 Raphael, $, jQuery, SMART*/
/*jslint eqeq: true, nomen: true, plusplus: true, newcap: true */
window.GC = window.GC || {};

(function () {
"use strict";
    
	function sortByAge(a, b) {
		return a.agemos - b.agemos;
	}
	
	/**
	 * If multiple records exist from the same day, then use the latest one and 
	 * ignore the others.
	 */
	function mergeIntoDays(data) {
		
		var len     = data.length,
			idx     = 0,
			rec     = null,
			day     = null,
			lastDay = 0,
			buffer  = -1,
			out     = [];
		
		for (idx = 0; idx < len; idx++) {
			rec = data[idx];
			day = Math.floor(rec.agemos * 30.4375);
			
			// If this record was made at the same day as the previous one - 
			// pick the latest one and store it as the "buffer"
			if ( day === lastDay ) {
				if ( buffer == -1 || rec.agemos > data[buffer].agemos ) {
					buffer = idx;
				}
			}
			
			// If this record was NOT made at the same day as the previous one -
			// get it, but first get the buffer if not empty
			else {
				if (buffer > -1) {
					out.push(data[buffer]);
					buffer = -1;
				}
				out.push(rec);
			}
			
			lastDay = day;
		}
		
		// In case there is only one record for day 0
		if (buffer > -1) {
			out.push(data[buffer]);
		}
		
		return out;
	}
    
    GC.deletePreferences = function () {
        var dfd = $.Deferred();
        SMART.delete_user_preferences()
             .success(function(r) {
                console.log ("Preferences deleted");
                dfd.resolve();
             })
             .error(function(e) {
                console.log(e.message);
                dfd.reject(e.message);
             });
        return dfd.promise();
    };
    
    GC.deleteScratchpad = function () {
        var dfd = $.Deferred();
        SMART.delete_scratchpad_data()
             .success(function(r) {
                console.log ("Scratchpad deleted", r);
                dfd.resolve(r);
             })
             .error(function(e) {
                console.log(e.message);
                dfd.reject(e.message);
             });
        return dfd.promise();
    };
    
    GC.setPreferences = function (dataStr) {
		var dfd = $.Deferred();
        SMART.put_user_preferences({data:dataStr, contentType:"application/json"})
             .success(function(r) {
                //console.log ("Preferences saved");
                dfd.resolve(r.json);
             })
             .error(function(e) {
                console.log(e);
                dfd.reject(e.message);
				//GC.deletePreferences();
             });
        return dfd.promise();
    };
    
    GC.setScratchpad = function (dataStr) {
        var dfd = $.Deferred();
        SMART.put_scratchpad_data({data:dataStr, contentType:"application/json"})
             .success(function(r) {
                console.log ("Scratchpad saved", r);
                dfd.resolve(r.json);
             })
             .error(function(e) {
                console.log(e.message);
                dfd.reject(e.message);
             });
        return dfd.promise();
    };
    
    GC.getPreferences = function () {
		
        var dfd = $.Deferred();
        SMART.get_user_preferences()
             .success(function(r) {
                console.log("Preferences value: " + r.body);
                dfd.resolve(r.json);
             })
             .error(function(e) {
                console.log(e);
                dfd.reject(e.message);
				GC.deletePreferences();
             });
        return dfd.promise();
    };

    GC.getScratchpad = function () {
        var dfd = $.Deferred();
        SMART.get_scratchpad_data()
             .success(function(r) {
                console.log("Scratchpad value: ", r);
                dfd.resolve(r.json);
             })
             .error(function(e) {
                console.log(e.message);
                dfd.reject(e.message);
             });
        return dfd.promise();
    };
    
    GC.getContainerManifest = function () {
        var dfd = $.Deferred();
        SMART.get_container_manifest()
             .success(function(r) {
                //console.log("Container Manifest: " + r.body);
                dfd.resolve(r);
             })
             .error(function(e) {
                console.log(e.message);
                dfd.reject(e.message);
             });
        return dfd.promise();
    };
	
    GC.get_demographics = function() {
        var dfd = $.Deferred();

        $.ajax({
          type: "get",
          url: SMART.server + "/patients/"+SMART.patient,
          dataType:"json",
          data: {access_token: SMART.auth.access_token}
        }).success(function(demos){
             var data = {};
             data.name = demos.name.givens.join(" ") + " " + demos.name.family;
             data.gender = demos.gender.toLowerCase();
             data.birthday = demos.birthTime.slice(0,10);
 
          dfd.resolve(data);
        });

        return dfd.promise();
    };

	GC.get_allergies = function() {
		var dfd = $.Deferred();
    setTimeout(function(){
      dfd.resolve({});
    })
		return dfd.promise();
	};

    var vitalMap = {
      "statureData": {
        unit: SMART.unit.cm,
        loinc: ["8302-2"]
      },
      "lengthData": {
        unit: SMART.unit.cm,
        loinc: ["8306-3"]
      },
      "weightData": {
        unit: SMART.unit.kg,
        loinc: ["3141-9"]
      },
      "headCData": {
        unit: SMART.unit.cm,
        loinc: ["8287-5"]
      },
      "BMIData": {
        unit: SMART.unit.any,
        loinc: ["39156-5"]
      }
    };

    var vitalCodes = [];
    Object.keys(vitalMap).forEach(function(k){
      vitalMap[k].loinc.forEach(function(c){
        vitalCodes.push(c);
      })
    });

    GC.get_vitals = function() {
        
        var dfd = $.Deferred(),
            vitals = {lengthData: [], statureData: [], weightData: [], headCData:[], BMIData:[]};
        
        $.ajax({
          type: "get",
          url: SMART.server + "/patients/"+SMART.patient+"/entries/vitals",
          data: {
            access_token: SMART.auth.access_token,
            q: {"vitalName.code": {"$in": vitalCodes}}
          },
        }).success(function(vdata){
          vdata.forEach(function(v){
            Object.keys(vitalMap).forEach(function(vk){
              var vm = vitalMap[vk];
              if (vm.loinc.indexOf(v.vitalName.code) !== -1){
                vitals[vk].push({
                  date: v.measuredAt.point,
                  value: vm.unit(v.physicalQuantity)
                });
              }
            });
          });
          dfd.resolve(vitals);
       });
    return dfd.promise();
    };
    
    GC.Patient = function (
		demographics, 
		vitals, 
		allergies, 
		familyHistory, 
		annotations, 
		boneAge
	) {
		
		this.allergies = {
			positive : [],
			negative : []
		};
		
		this.familyHistory = {
			father : {
				height: null
			},
			mother : {
				height: null
			}
		};
		
		this.data = {
			length : [], 
			stature : [], 
			lengthAndStature : [],
			weight : [], 
			headc : [], 
			bmi : []
		};
		
        this.annotations = [];
		this.boneAge = [];
		this.model = null;
		
		this.init( demographics, vitals, allergies, familyHistory, annotations, boneAge );
    };
	
	GC.Patient.prototype = {
		
		/**
		 * The patient's name
		 */
		name : "Unknown Name",
		
		/**
		 * The patient's birth date (format from SMART)
		 * @type String
		 */
		birthdate : "Unknown Birthdate",
		
		/**
		 * The patient's gender ("male" or "female")
		 * @type String
		 */
		gender : "Unknown Gender",
		
		/**
		 * The patient's gestation age in months. That is the difference betwen 
		 * the EDD and the birth date.
		 * @type Number
		 */
		gestationAge : null,
		
		/**
		 * The mid. parental height in "cm". Defaults to 175 if we do not have
		 * the height of both parents.
		 * @type Number
		 */
		midParentalHeight : 175, // TODO: Should be null or 0 ?
		
		weeker : null,
		
		EDD : null
	};
	
	/**
	 * Initialize the instance
	 * @param demographics
	 * @param vitals
	 * @param allergies
	 * @param familyHistory
	 */
	GC.Patient.prototype.init = function( 
		demographics, 
		vitals, 
		allergies, 
		familyHistory, 
		annotations, 
		boneAge 
	) {
		this.name         = demographics.name;
		this.birthdate    = demographics.birthday;
		this.gender       = demographics.gender;
		this.gestationAge = demographics.gestationalAge ? Math.min(demographics.gestationalAge, 0) : null;
		
		this.DOB          = new XDate( this.birthdate );
		if (demographics.DOB) {
			this.setDOB(demographics.DOB);
		}
		
		//if (this.gestationAge !== null) {
		//	this.EDD = this.DOB.clone().addMonths(this.gestationAge * -1); //(new XDate( this.birthdate )).addWeeks( -(40 + this.gestationAge * GC.Constants.TIME_INTERVAL.WEEKS_IN_MONTH) );
		//}
		
		//age
		//dol
		this.setAllergies( allergies );
		this.setFamilyHistory( familyHistory );
		
		if (demographics.EDD) {
			this.setEDD(demographics.EDD);
		}
		else if (this.gestationAge !== null) {
			this.setEDD(this.DOB.clone().addMonths(this.gestationAge * -1));
		}
		
		
		if (this.DOB && this.EDD) {
			this.weeker = Math.floor(40 - this.DOB.diffWeeks(this.EDD));
		}
		
		//if (!this.EDD) {
		//	this.setEDD(this.birthdate);
		//}
		$.extend(true, this.annotations, annotations);
		$.extend(true, this.boneAge, boneAge);
		
		// Populate the patient's "data" object (except for the "lengthAndStature")
		var map = {
			"length"  : vitals.lengthData,
			"stature" : vitals.statureData,
			"weight"  : vitals.weightData,
			"headc"   : vitals.headCData,
			"bmi"     : vitals.BMIData
		}, data, patient = this, name;
		
		for ( name in map ) {
			data = map[name];
			if ( data ) {
				$.each( data, function(i, o) {
					patient.data[name].push ({
						agemos: "agemos" in o ? o.agemos : patient.DOB.diffMonths(new XDate(o.date)),
						value : o.value
					});
				});
				this.data[name].sort(sortByAge);
				this.data[name] = mergeIntoDays(this.data[name]);
			}
		}
		
		// "lengthAndStature" is created by merging "length" and "stature"
		this.data.lengthAndStature = this.data.length.slice().concat(this.data.stature);
		this.data.lengthAndStature.sort(sortByAge);
		
		
	};
	
	GC.Patient.prototype.getCurrentAge = function() {
		return (new GC.TimeInterval()).setStartDate(this.DOB);
	};
	
	GC.Patient.prototype.getCorretedAge = function() {
		var age = (new GC.TimeInterval()).setStartDate(this.DOB);
		if (this.gestationAge) {
			age.addMonths(this.gestationAge);
		}
		return age;
	};
	
	GC.Patient.prototype.setDOB = function( d ) {
		d = new XDate( d );
		if ( d.valid() ) {
			this.DOB = d;
			this.gestationAge = Math.min(this.EDD.diffMonths( this.DOB ), 0);
			this.birthdate = d.toString();
		}
	};
	
	GC.Patient.prototype.setEDD = function( d ) {
		d = new XDate( d );
		if ( d.valid() ) {
			this.EDD = d;
			this.gestationAge = Math.min(this.EDD.diffMonths( this.DOB ), 0);
		}
	};
	
	GC.Patient.prototype.isPremature = function() {
		return this.EDD && this.DOB.diffWeeks(this.EDD) > 3;
	};
	
	/**
	 * Sets the allergies from the smart data.
	 * TODO: Implement this when we have some data
	 * @returns GC.Patient
	 */
	GC.Patient.prototype.setAllergies = function( allergies ) {
		if ( allergies && !allergies.noalergy ) {
			// this.allergies.positive = ?
			// this.allergies.negative = ?
        }
		return this;
	};
	
	/**
	 * Sets the familyHistory meta data and updates the midParentalHeight in 
	 * case both parents have known height
	 * @param {Object} history
	 * @returns GC.Patient
	 */
	GC.Patient.prototype.setFamilyHistory = function( history ) {
		history = $.extend({
			father : {
				height: this.familyHistory.father.height
			},
			mother : {
				height: this.familyHistory.mother.height
			}
		}, history);
		
		this.familyHistory.father.height = GC.Util.floatVal( history.father.height );
		this.familyHistory.mother.height = GC.Util.floatVal( history.mother.height );
		
		if ( this.familyHistory.father.height && this.familyHistory.mother.height ) {
			this.midParentalHeight = GC.Util.round((this.familyHistory.father.height + this.familyHistory.mother.height) / 2);
		}
		
		return this;
	};
	
	GC.Patient.prototype.getModel = function() {
		if ( !this.model ) {
			var model = {};
			
			// Length and Stature
			$.each(this.data.lengthAndStature, function(i, o) {
				if ( o.agemos in model )
					model[ o.agemos ].lengthAndStature = o.value;
				else 
					model[ o.agemos ] = { "lengthAndStature" : o.value };
			});
			
			// Weight
			$.each(this.data.weight, function(i, o) {
				if ( o.agemos in model )
					model[ o.agemos ].weight = o.value;
				else 
					model[ o.agemos ] = { "weight" : o.value };
			});
			
			// HEADC
			$.each(this.data.headc, function(i, o) {
				if ( o.agemos in model )
					model[ o.agemos ].headc = o.value;
				else 
					model[ o.agemos ] = { "headc" : o.value };
			});
			
			// BMI
			$.each(this.data.bmi, function(i, o) {
				if ( o.agemos in model )
					model[ o.agemos ].bmi = o.value;
				else 
					model[ o.agemos ] = { "bmi" : o.value };
			});
			
			// Bone Age
			$.each(this.boneAge, function(i, o) {
				if ( o.agemos in model )
					model[ o.agemos ].boneAge = o.boneAge;
				else 
					model[ o.agemos ] = { "boneAge" : o.boneAge };
			});
			
			// Annotations
			$.each(this.annotations, function(i, o) {
				if ( o.agemos in model )
					model[ o.agemos ].annotation = o.annotation;
				else 
					model[ o.agemos ] = { "annotation" : o.annotation };
			});
			
			var tmp = [];
			$.each(model, function( age, data ) {
				data.agemos = GC.Util.floatVal(age);
				tmp.push(data);
			});
			tmp.sort(function( a, b ) {
				return a.agemos - b.agemos;
			});
			
			this.model = tmp;
			model = null;
		}
		return this.model;
	};
	
	GC.Patient.prototype.refresh = function() {
		var model = this.getModel(), patient = this;
		
		patient.data.length = [];
		patient.data.stature = [];
		patient.data.weight = [];
		patient.data.headc = [];
		patient.data.bmi = [];
		patient.data.lengthAndStature = [];
		patient.annotations = [];
		
		$.each(model, function(i, o) {
			if ("lengthAndStature" in o) {
				if (o.agemos <= 24) {
					patient.data.length.push({
						agemos : o.agemos,
						value  : o.lengthAndStature
					});
				} else {
					patient.data.stature.push({
						agemos : o.agemos,
						value  : o.lengthAndStature
					});
				}
			}
			if ("weight" in o) {
				patient.data.weight.push({
					agemos : o.agemos,
					value  : o.weight
				});
			}
			if ("headc" in o) {
				patient.data.headc.push({
					agemos : o.agemos,
					value  : o.headc
				});
			}
			if ("bmi" in o) {
				patient.data.bmi.push({
					agemos : o.agemos,
					value  : o.bmi
				});
			}
			if ("boneAge" in o) {
				patient.boneAge.push({
					agemos  : o.agemos,
					boneAge : o.annotation
				});
			}
			if ("annotation" in o) {
				patient.annotations.push({
					agemos      : o.agemos,
					annotation  : o.annotation
				});
			}
		});
		
		// "lengthAndStature" is created by merging "length" and "stature"
		this.data.lengthAndStature = this.data.length.slice().concat(this.data.stature);
		this.data.lengthAndStature.sort(sortByAge);
	};
	
	/**
	 * This method will iterate over each entry before the @agemos, calling the 
	 * @isAccepted callback that should return boolean. The tipical use is to 
	 * find the first available entry before @agemos having some of the data 
	 * properties.
	 * @param {Number} agemos The current age.
	 * @param {Function} isAccepted Called with one argument - the entry to test
	 */
	GC.Patient.prototype.getPrevModelEntry = function( agemos, isAccepted ) {
		var entry = null, 
			model = this.getModel(),
			len   = model.length,
			i;
		for ( i = 0; i < len; i++ ) {
			if ( model[i].agemos < agemos ) {
				if ( !entry || model[i].agemos >= entry.agemos ) {
					if ( isAccepted(model[i]) ) {
						entry = model[i];
					}
				}
			}
		}
		return entry;
	};
	
	GC.Patient.prototype.getNextModelEntry = function( agemos, isAccepted ) {
		var entry = null, 
			model = this.getModel(),
			len   = model.length,
			i;
		for ( i = 0; i < len; i++ ) {
			if ( model[i].agemos > agemos ) {
				if ( !entry || model[i].agemos <= entry.agemos ) {
					if ( isAccepted(model[i]) ) {
						entry = model[i];
					}
				}
			}
		}
		return entry;
	};
	
	GC.Patient.prototype.getLastModelEntry = function( isAccepted ) {
		var model = this.getModel(), i;
		for ( i = model.length - 1; i >= 0; i-- ) {
			if ( !$.isFunction(isAccepted) || isAccepted(model[i]) ) {
				return model[i];
			}
		}
		return null;
	};
	
	GC.Patient.prototype.getFirstModelEntry = function( isAccepted ) {
		var model = this.getModel();
		for ( var i = 0, l = model.length; i < l; i++ ) {
			if ( !$.isFunction(isAccepted) || isAccepted(model[i]) ) {
				return model[i];
			}
		}
		return null;
	};
	
	GC.Patient.prototype.geModelEntryAtAgemos = function( agemos ) {
		var out = null;
		$.each(this.getModel(), function(i, o) {
			if (Math.abs(o.agemos - agemos) < 1 / GC.Constants.TIME.MONTH) {
				out = o;
				return false;
			}
		});
		return out;
	};
    
	GC.Patient.prototype.geModelIndexAtAgemos = function( agemos ) {
		var out = null;
		$.each(this.getModel(), function(i, o) {
			if (Math.abs(o.agemos - agemos) < 1 / GC.Constants.TIME.MONTH) {
				out = i;
				return false;
			}
		});
		return out;
	};
    
	
}());

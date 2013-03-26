/*global Chart, GC, PointSet, Raphael, XDate, console,
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
                //console.log ("Preferences deleted");
                dfd.resolve();
             })
             .error(function(e) {
                //console.log(e.message);
                dfd.reject(e.message);
             });
        return dfd.promise();
    };
    
    GC.deleteScratchpad = function () {
        var dfd = $.Deferred();
        SMART.delete_scratchpad_data()
             .success(function(r) {
                //console.log ("Scratchpad deleted", r);
                dfd.resolve(r);
             })
             .error(function(e) {
                //console.log(e.message);
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
                //console.log(e);
                dfd.reject(e.message);
				//GC.deletePreferences();
             });
        return dfd.promise();
    };
    
    GC.setScratchpad = function (dataStr) {
        var dfd = $.Deferred();
        SMART.put_scratchpad_data({data:dataStr, contentType:"application/json"})
             .success(function(r) {
                //console.log ("Scratchpad saved", r);
                dfd.resolve(r.json);
             })
             .error(function(e) {
                //console.log(e.message);
                dfd.reject(e.message);
             });
        return dfd.promise();
    };
    
    GC.getPreferences = function () {
		
        var dfd = $.Deferred();
        SMART.get_user_preferences()
             .success(function(r) {
                //console.log("Preferences value: " + r.body);
                dfd.resolve(r.json);
             })
             .error(function(e) {
                //console.log(e);
                dfd.reject(e.message);
				GC.deletePreferences();
             });
        return dfd.promise();
    };

    GC.getScratchpad = function () {
        var dfd = $.Deferred();
        SMART.get_scratchpad_data()
             .success(function(r) {
                //console.log("Scratchpad value: ", r);
                dfd.resolve(r.json);
             })
             .error(function(e) {
                //console.log(e.message);
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
                //console.log(e.message);
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
    
    GC.get_parental_heights = function() {
    
        var dfd = $.Deferred();
            
        SMART.get_family_history_observations()
             .success(function(history) {
             
                var data = [],
                    parents = {},
                    i;
                    
                history.graph
                    .prefix('dcterms','http://purl.org/dc/terms/')
                    .prefix('sp','http://smartplatforms.org/terms#')
                    .prefix('rdf','http://www.w3.org/1999/02/22-rdf-syntax-ns#')
                    .where('?h rdf:type sp:FamilyHistory')
                    .where('?h sp:aboutRelative ?r')
                    .where('?r sp:code ?c')
                    .where('?c dcterms:identifier ?code')
                    .where('?h sp:height ?ht')
                    .where('?ht sp:unit \"cm\"')
                    .where('?ht sp:value ?height')
                    .each(function(){
						data.push({
                            relativeCode: this.code.value,
                            height: Number(this.height.value)
                        });
                    });
                    
                for (i = 0; i < data.length; i++) {
                    switch (data[i].relativeCode) { // SNOMED CT code
                        case '66839005': // Father
                        case '9947008':  // Natural father
                        case '75615008': // Surrogate father
                            parents.father = {isBio: true, height: data[i].height};
                            break;
                        case '609005':   // Adoptive father
                        case '8458002':  // Foster father
                        case '30578000': // Step-father
                        case '67147004': // Legal father
                            parents.father = {isBio: false, height: data[i].height};
                            break;                           
                        case '72705000': // Mother
                        case '65656005': // Natural mother
                        case '27508009': // Surrogate mother
                            parents.mother = {isBio: true, height: data[i].height};
                            break;
                        case '21464003': // Adoptive mother
                        case '38265003': // Foster mother
                        case '65412001': // Step-mother
                        case '62090008': // Legal mother
                            parents.mother = {isBio: false, height: data[i].height};
                            break;    
                        default:
                    }
                }
                    
                dfd.resolve(parents);
            })
            .error(function(e) {
                dfd.reject(e.message);
            });
            
        return dfd.promise();
    };
    
    GC.get_bone_age_results = function() {
        var dfd = $.Deferred();
        SMART.get_lab_results()
            .success(function(labs) {
                var data = [];
                
                labs.graph
                    .prefix('dcterms','http://purl.org/dc/terms/')
                    .prefix('sp','http://smartplatforms.org/terms#')
                    .prefix('rdf','http://www.w3.org/1999/02/22-rdf-syntax-ns#')
                    .where('?l rdf:type sp:LabResult')
                    .where('?l dcterms:date ?date')
                    .where('?l sp:labName ?ln')
                    .where('?ln sp:code ?c')
                    .where('?c dcterms:identifier \"37362-1\"')
                    .where('?c sp:system \"http://purl.bioontology.org/ontology/LNC/\"')
                    .where('?l sp:quantitativeResult ?q')
                    .where('?q sp:valueAndUnit ?vu')
                    .where('?vu sp:value ?boneage')
                    .where('?vu sp:unit \"mo\"')
                    .each(function(){
                        data.push({
                            date: this.date.value,
                            boneAgeMos: Number(this.boneage.value)
                        });
                    });

                dfd.resolve(data);
            })
            .error(function(e) {
                dfd.reject(e.message);
            });
        return dfd.promise();
    };
    
    GC.get_clinical_notes = function() {
        var dfd = $.Deferred();
        SMART.get_clinical_notes()
            .success(function(notes) {
                var data = [];

                notes.graph
                    .prefix('dcterms','http://purl.org/dc/terms/')
                    .prefix('sp','http://smartplatforms.org/terms#')
                    .prefix('rdf','http://www.w3.org/1999/02/22-rdf-syntax-ns#')
                    .where('?l rdf:type sp:ClinicalNote')
                    .where('?l dcterms:date ?date')
                    .where('?l dcterms:hasFormat ?f')
                    .where('?f dcterms:format ?ft')
                    .where('?ft rdfs:label \"text/plain\"')
                    .where('?f rdf:value ?note')
                    .each(function(){
                        data.push({
                            date: this.date.value,
                            note: this.note.value
                        });
                    });

                dfd.resolve(data);
            })
            .error(function(e) {
                dfd.reject(e.message);
            });
        return dfd.promise();
    };

	GC.get_allergies = function() {
		var dfd = $.Deferred();
        SMART.get_allergies()
			.success(function(allerg) {
                var allergies = allerg.graph
					/*.prefix('dcterms','http://purl.org/dc/terms/')
					.prefix('sp','http://smartplatforms.org/terms#')*/
					.where("?allergyexclusion rdf:type sp:AllergyExclusion")
					.where("?allergyexclusion sp:allergyExclusionName ?allergy_name_code")
					.where("?allergy_name_code dcterms:title ?allergyExclusionName");
				allergies.each(function(i, single_allergy) {
					dfd.resolve({noallergy: single_allergy.allergyExclusionName});
				});
			})
			.error(function(e) {
                dfd.reject(e.message);
            });
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
				height: null,
				isBio : false
			},
			mother : {
				height: null,
				isBio : false
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
		this.gestationAge = demographics.gestationalAge || null;
		this.weeker       = this.gestationAge;
		
		this.DOB = new XDate(this.birthdate);
		if (demographics.DOB) {
			this.setDOB(demographics.DOB);
		}
		
		this.setAllergies( allergies );
		this.setFamilyHistory( familyHistory );
		
		if (demographics.EDD) {
			this.setEDD(demographics.EDD);
		}
		else if (this.gestationAge !== null) {
			this.setEDD(this.DOB.clone().addWeeks(40 - this.gestationAge));
		}
		
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
						agemos: o.hasOwnProperty("agemos") ? 
							o.agemos : 
							patient.DOB.diffMonths(new XDate(o.date)),
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
		return new GC.TimeInterval(this.DOB);
	};
	
	GC.Patient.prototype.getCorrectedAge = function() {
		var age = new GC.TimeInterval(this.DOB);
		age.addWeeks((this.gestationAge || 40) - 40);
		return age;
	};
	
	GC.Patient.prototype.getGestatonCorrection = function() {
		return new GC.TimeInterval(this.EDD, this.DOB);
	};
	
	GC.Patient.prototype.setDOB = function( d ) {
		d = new XDate( d );
		if ( d.valid() ) {
			this.DOB = d;
			this.birthdate = d.toString();
			this.gestationAge = this.weeker = Math.round(40 - this.DOB.diffWeeks(this.EDD));
			
			$("html")
			.trigger("change:patient:DOB", this.DOB)
			.trigger("change:patient:gestationAge", this.gestationAge)
			.trigger("change:patient:weeker", this.weeker)
			.trigger("change:patient:birthdate", this.birthdate)
			.trigger("change:patient", this);
		}
	};
	
	GC.Patient.prototype.setEDD = function( d ) {
		d = new XDate( d );
		if ( d.valid() ) {
			this.EDD = d;
			this.gestationAge = this.weeker = Math.round(40 - this.DOB.diffWeeks(d));
			
			$("html")
			.trigger("change:patient:EDD", this.EDD)
			.trigger("change:patient:gestationAge", this.gestationAge)
			.trigger("change:patient:weeker", this.weeker)
			.trigger("change:patient", this);
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
		//console.log("setAllergies: ", allergies);
		if ( allergies && !allergies.noalergy ) {
			if ($.isArray(allergies.positive)) {
				this.allergies.positive = allergies.positive.slice();
			}
			if ($.isArray(allergies.negative)) {
				this.allergies.negative = allergies.negative.slice();
			}
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
		
		var old = $.extend(true, {}, this.familyHistory);
		
		$.extend(true, this.familyHistory, history);
		
		this.familyHistory.father.height = GC.Util.floatVal( this.familyHistory.father.height );
		this.familyHistory.mother.height = GC.Util.floatVal( this.familyHistory.mother.height );
		
		if (this.familyHistory.father.height && 
			this.familyHistory.mother.height &&
			this.familyHistory.father.isBio  && 
			this.familyHistory.mother.isBio) {
			this.midParentalHeight = GC.Util.round((this.familyHistory.father.height + this.familyHistory.mother.height) / 2);
		} else {
			this.midParentalHeight = null;
		}
		
		if (this.familyHistory.father.height !== old.father.height || 
			this.familyHistory.mother.height !== old.mother.height || 
			this.familyHistory.father.isBio  !== old.father.isBio || 
			this.familyHistory.mother.isBio  !== old.mother.isBio) {
			$("html").trigger("change:patient:familyhistory");
		}
		
		old = null;
		
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
		
		model.sort(function(a, b) {
			return a.agemos - b.agemos;
		});
		
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
					boneAge : o.boneAge
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
		
		$("html").trigger("change:patient", this);
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
		var model = this.getModel(), i, l = model.length;
		for ( i = 0; i < l; i++ ) {
			if ( !$.isFunction(isAccepted) || isAccepted(model[i]) ) {
				return model[i];
			}
		}
		return null;
	};
	
	GC.Patient.prototype.getModelEntryAtAgemos = function( agemos ) {
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
    
	GC.Patient.prototype.getLastEnryHaving = function(propName) {
		return this.getLastModelEntry(function(entry) {
			return entry[propName] !== undefined;
		});
	};
	
	// =========================================================================
	//                        Height Estimation Methods
	// =========================================================================
	GC.Patient.prototype.getMidParentalHeight = function(forAgemos) {
		
		forAgemos = forAgemos || 12 * 20;
		
		if (!this.familyHistory.father.height || 
			!this.familyHistory.mother.height || 
			!this.familyHistory.father.isBio  ||
			!this.familyHistory.mother.isBio) {
			return null;
		}
		var midHeight = GC.Util.round((this.familyHistory.father.height + this.familyHistory.mother.height) / 2);
		
		var dataSet    = GC.DATA_SETS.CDC_STATURE;
		var data       = dataSet.data[this.gender];
		var lastAgeMos = GC.Util.findMinMax(data, "Agemos").max;
		
		if ( lastAgeMos < forAgemos ) {
			return null;
		}
		
		var pctLast = GC.findPercentileFromX(
			midHeight, 
			dataSet, 
			this.gender, 
			lastAgeMos
		);
		
		var nom = GC.findXFromPercentile(
			pctLast, 
			dataSet, 
			this.gender, 
			forAgemos || 12 * 20 
		);
		
		return {
			height     : GC.Util.floatVal(nom, midHeight),
			percentile : pctLast,
			title      : GC.str("STR_32") // Mid. Parental Height
		};
	};
	
	GC.Patient.prototype.getBoneAgeAdjustedHeight = function(forAgemos) {
		var lastHeightEntry = this.getLastEnryHaving("lengthAndStature");
		
		if ( !lastHeightEntry || lastHeightEntry.agemos < GC.chartSettings.heightEstimatesMinAge ) {
			return null;
		}
		
		var boneAgeHeight = GC.getBoneAgeEstimate(this);
		if (!boneAgeHeight) {
			return null;
		}
		
		var dataSet       = GC.DATA_SETS.CDC_STATURE;
		var data          = dataSet.data[this.gender];
		var lastAgeMos    = GC.Util.findMinMax(data, "Agemos").max;
		
		if ( lastAgeMos < lastHeightEntry.agemos ) {
			return null;
		}
		
		var pctLast = GC.findPercentileFromX(
			boneAgeHeight, 
			dataSet, 
			this.gender, 
			lastAgeMos
		);
		
		var nom = GC.findXFromPercentile(
			pctLast, 
			dataSet, 
			this.gender, 
			forAgemos || 12 * 20 
		);
		
		return {
			height     : nom,
			percentile : pctLast,
			title      : GC.str("STR_34") // Mid. Parental Height
		};
	};
	
	GC.Patient.prototype.getLatestPercentileHeight = function(forAgemos) {
		
		var lastHeightEntry = this.getLastEnryHaving("lengthAndStature");
		
		if ( !lastHeightEntry || lastHeightEntry.agemos < GC.chartSettings.heightEstimatesMinAge ) {
			return null;
		}
		
		var dataSet    = GC.DATA_SETS.CDC_STATURE;
		var data       = dataSet.data[this.gender];
		var lastAgeMos = GC.Util.findMinMax(data, "Agemos").max;
		
		if ( lastAgeMos < lastHeightEntry.agemos ) {
			return null;
		}
		
		var pctLast = GC.findPercentileFromX(
			lastHeightEntry.lengthAndStature, 
			dataSet, 
			this.gender, 
			lastHeightEntry.agemos
		);
		
		var nom = GC.findXFromPercentile(
			pctLast, 
			dataSet, 
			this.gender, 
			forAgemos || 12 * 20
		);
		
		return {
			height     : nom,
			percentile : pctLast,
			title      : GC.str("STR_33") // Nominal Height
		};
	};
	
	GC.Patient.prototype.getVelocity = function( prop, atRecord, toRecord, denominator, suffix ) {
		if ( atRecord.hasOwnProperty(prop) ) {
			toRecord = toRecord || this.getPrevModelEntry(atRecord.agemos, function(o) {
				return o.hasOwnProperty(prop);
			});
			if (toRecord) {
				//denominator = (denominator || GC.Constants.TIME.MONTH)// /GC.Constants.TIME.MONTH;
				var deltaTime = (atRecord.agemos - toRecord.agemos);
				
				if (!denominator) {
					denominator = GC.chartSettings.roundPrecision.velocity[GC.chartSettings.nicu ? "nicu" : "std"];
				}
				
				switch (denominator) {
					case "year":
						denominator = 12;
						suffix = "/" + GC.str("STR_24").toLowerCase();
						break;
					case "month":
						denominator = 1;
						suffix = "/" + GC.str("STR_26").toLowerCase();
						break;
					case "week":
						denominator = 1/GC.Constants.TIME_INTERVAL.WEEKS_IN_MONTH;
						suffix = "/" + GC.str("STR_28").toLowerCase();
						break;
					case "day":
						denominator = 1/GC.Constants.TIME_INTERVAL.DAYS_IN_MONTH;
						suffix = "/" + GC.str("STR_30").toLowerCase();
						break;
					case "auto":
						if (Math.abs(deltaTime) >= 12) {
							denominator = 12;
							suffix = "/" + GC.str("STR_24").toLowerCase();
						}
						else if (Math.abs(deltaTime) >= 1) {
							denominator = 1;
							suffix = "/" + GC.str("STR_26").toLowerCase();
						}
						else if (Math.abs(deltaTime) >= 1/GC.Constants.TIME_INTERVAL.WEEKS_IN_MONTH) {
							denominator = 1/GC.Constants.TIME_INTERVAL.WEEKS_IN_MONTH;
							suffix = "/" + GC.str("STR_28").toLowerCase();
						}
						else {
							denominator = 1/GC.Constants.TIME_INTERVAL.DAYS_IN_MONTH;
							suffix = "/" + GC.str("STR_30").toLowerCase();
						}
						break;
					default:
						throw "Invalid velocity denominator '" + denominator + "'.";
					
				}
				
				var v = (atRecord[prop] - toRecord[prop]) / deltaTime; // per month
				//v *= denominator/GC.Constants.TIME.MONTH;
				v = GC.Util.roundToPrecision(v * denominator, 1);
				//if (suffix) {
				//	v += suffix;
				//}
				//return v;
				return {
					value       : v,
					denominator : denominator,
					suffix      : suffix
				};
			}
		}
		return null;
	};
	
}());

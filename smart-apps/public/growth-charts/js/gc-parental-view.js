(function() {
		
	function PView(paper) {
		this.paper = paper;
		
		this.fatherHeight = 0;
		this.motherHeight = 0;
		this.childHeight  = 0;
		
		this._fatherHeightImage = null;
		this._motherHeightImage = null;
		this._childHeightImage = null;
	};
	
	
	PView.prototype = {
		
		/**
		 * Clears the paper and empties the object references
		 */
		clear : function() {
			this.paper.clear();
			this._fatherHeightImage = null;
			this._motherHeightImage = null;
			this._childHeightImage = null;
		},
		
		draw : function() {
			this.clear();
			this.setFatherHeight(PATIENT.familyHistory.father.height);
			this.setMotherHeight(PATIENT.familyHistory.mother.height);
			this.setChildHeight(PATIENT.midParentalHeight);
		},
		
		/**
		 * Creates (if needed) and returns the father's height image 
		 */
		getFatherHeightImage : function() {
			if (!this._fatherHeightImage) {
				this._fatherHeightImage = this.paper.image();
			}
			return this._fatherHeightImage;
		},
		
		/**
		 * Creates (if needed) and returns the mother's height image 
		 */
		getMotherHeightImage : function() {
			if (!this._motherHeightImage) {
				this._motherHeightImage = this.paper.image();
			}
			return this._motherHeightImage;
		},
		
		/**
		 * Creates (if needed) and returns the child's height image 
		 */
		getChildHeightImage : function() {
			if (!this._childHeightImage) {
				this._childHeightImage = this.paper.image().attr({
					
				});
			}
			return this._childHeightImage;
		},
		
		/**
		 * 
		 */
		_setFatherHeight : function(h) {
			var img = this.getFatherHeightImage(),
				h   = (this.paper.height * h / 200) - 10;
			
			img.animate({
				height: h
			}, 400);
		},
		
		/**
		 * 
		 */
		_setMotherHeight : function(h) {
			var img = this.getMotherHeightImage();
		},
		
		/**
		 * 
		 */
		_setChildHeight : function(h) {
			var img = this.getChildHeightImage();
		},
		
		/**
		 * 
		 */
		editParentHeight : function(type) {
			var heightTmp = null;
			
			if (type == "mother") {
				heightTmp = prompt(GC.str("STR_145") + ":", this.motherHeight);
			}
			else if (type == "father") {
				heightTmp = prompt(GC.str("STR_146") + ":", this.fatherHeight);
			}
			
			if (heightTmp === null) { // on Cancel
				return;
			}
		
			var heightTmpFloat = GC.Util.floatVal(heightTmp);
			if (heightTmpFloat < 100 ||  heightTmpFloat > 250) {
				return alert(
					'"' + heightTmp + '" ' + 
					GC.str(type == "mother" ? "STR_150" : "STR_151")
				);
			} 
			
			if ((type == "mother" && heightTmpFloat === this.motherHeight) || 
				(type == "father" && heightTmpFloat === this.fatherHeight)) {
				return
			}
		
			this[type == "mother" ? 
				"setMotherHeight" : 
				"setFatherHeight"](heightTmpFloat);
		}
	}
})();

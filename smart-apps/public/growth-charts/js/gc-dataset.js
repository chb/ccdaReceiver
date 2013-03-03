function DataSet( name, gender ) 
{
	this._dataSet = null;
	this._length = 0;
	this._data = [];
	this._init( name, gender );
}

DataSet.prototype = {
	
	name : "Empty DataSet",
	
	_init : function( name, gender ) 
	{
		if ( GC.DATA_SETS.hasOwnProperty( name ) ) {
			this.name     = name;
			this.gender   = gender;
			this._dataSet = GC.DATA_SETS[ name ];
			
			var inst = this;
			
			$.each( this._dataSet.data[gender], function( key, entry ) {
				
				if ( inst._dataSet.type == "LMS" ) {
					inst._add(new GC.Point(
						entry.Agemos, 
						GC.findXFromPercentile(0.5, inst._dataSet, gender, entry.Agemos),
						entry
					));
				}
				
			});
		}
	},
	
	_add : function( entry ) {
		this._length = this._data.push( entry );
	},
	
	limit : function() {},
	crop : function() {},
	getBounds : function() {}
	
};




function limitOuter( arr, prop, min, max ) {
	var out = [], prev = null, next = null;
	$.each(arr, function( i, point ) {
		
		if ( point[prop] < min ) {
			if ( !prev || prev[prop] < point[prop] ) {
				prev = point;
			}
		}
		
		if ( point[prop] > max ) {
			if ( !next || next[prop] > point[prop] ) {
				next = point;
			}
		}
		
		if ( point[prop] <= max && point[prop] >= min ) {
			out.push(point);
		}
		
	});
	
	if ( prev ) {
		out.unshift( prev );
	}
	
	if ( next ) {
		out.push( next );
	}
	
	return out;
}

function closest( arr, prop, now ) {
	var prev = null, next = null;
	$.each(arr, function( i, point ) {
		if ( point[prop] < now ) {
			if ( !prev || prev[prop] > point[prop] ) {
				prev = point;
			}
		}
		if ( point[prop] > now ) {
			if ( !next || next[prop] > point[prop] ) {
				next = point;
			}
		}
	});
	return [ prev, next ];
}

function crop( arr, prop, prop2, min, max ) {
	var out = limitOuter( arr, prop, min, max );
	
	$.each(out, function(i, point) {
	//	if ()
	});
}

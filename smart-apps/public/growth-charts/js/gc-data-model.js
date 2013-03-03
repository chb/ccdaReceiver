/**
 * Module observable
 */
function observable( obj )
{
	var _broadcaster = $('<div/>');
	
	obj.bind = function( e, handler ) {
		_broadcaster.bind( e, handler );
		return this;
	};
	
	obj.one = function( e, handler ) {
		_broadcaster.one( e, handler );
		return this;
	};
	
	obj.unbind = function( e ) {
		_broadcaster.unbind( e );
		return this;
	};
	
	obj.trigger = function( e, args ) {
		e = $.Event(e);
		_broadcaster.trigger( e, args );
		return !e.isDefaultPrevented();
	};
	
	_broadcaster.bind("uninit", function() {
		_broadcaster.unbind();
		return obj;
	});
}

/**
 * Module iterable
 */
function iterable( obj, items, lengthProp ) 
{
	/**
	 * Iterates over the data items using the fastest method available.
	 * @param {Function} callback The callback function that will be invoked 
	 *                            with the following arguments:
	 *                            0 - the data item
	 *                            1 - the index of the item
	 *                            2 - the data array
	 *                            Inside the callback "this" will point to the 
	 *                            PointSet instance.
	 * @returns {PointSet} Returns this instance.
	 * @type Function
	 */
	obj.forEach = function( callback ) {
		this[items].forEach( callback, this );
		return this;
	};
	
	obj.indexOf = function( searchElement, fromIndex ) {
		return this[items].indexOf( searchElement, fromIndex );
	};
}

function Model( items )
{
	this._items = [];
	this._length = 0;
	
	iterable( this, "_items", "_length" );
	observable( this );
	
	this._add = function( entry, silent ) {
		this._length = this._items.push( entry );
		if ( !silent ) {
			this.trigger("add", [entry]);
		}
		return this;
	};
	
	this._remove = function( entry, silent ) {
		var i = this.indexOf( entry );
		if ( i > -1 ) {
			this._items.splice( i, 1 );
			this._length--; 
			if ( !silent ) {
				this.trigger("remove", [entry]);
			}
		}
		return this;
	};
	
	if ( items ) {
		var inst = this;
		$.each( $.makeArray( items ), function(i, o) {
			inst.add(o);
		});
	}
}

Model.prototype = {
	
	add : function( entry, silent ) {
		if ( this.trigger("beforeAdd", [entry]) ) {
			this._add( entry, silent );
		}
		return this;
	},
	
	remove : function( entry, silent ) {
		if ( this.trigger("beforeRemove", [entry]) ) {
			this._remove( entry, silent );
		}
		return this;
	}
	
};


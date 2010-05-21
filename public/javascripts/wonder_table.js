WonderTable = Class.create(
{

    initialize: function(el, options ){
	this.options = $H({
			      'sort': true,
			      'no_sort': []
	}).merge( options );
	this.render=[];
	this.parameters = $H( this.options.get('parameters') );
	this.container = new Element('div',{'class':'wonder-container'} );
	$(el).insert(this.container);

	this.table = new Element('table',{className:'wonder sortable'});

	this.head = new Element('thead');
	this.table.insert( this.head );
	this.head_row = $( this.head.insertRow( 0 ) );

	this.body = new Element('tbody');
	this.table.insert( this.body );
	this.container.insert( this.table );
	this.body.observe('scroll', function(ev){
	    if ( this.scrollBottom() < -20 ){
		ev.target.fire('WonderTable:nearingBottom', { 'remaining' : Math.abs( this.scrollBottom() ) } );
	    }
	}.bind(this) );

	if ( ( header = this.options.get('header') ) ){
	    this.setHeader( header );
	}
	if ( this.options.get('url') ){
	    this.requestRows();
	}

	if ( this.options.get('sort') ){
	    this.head_row.on('click', 'th', function(ev){
		this.sortByColumn( ev.target.cellIndex, ! ev.target.hasClassName('asc') );
	    }.bind(this) );
	}
    },

    sortByColumn:function( index, up_down ){
	if ( this.options.get('no_sort').include( index ) ){
	    return;
	}
	if ( this.sorted_by ){
	    this.sorted_by.removeClassName( 'sorted').removeClassName('asc').removeClassName('desc');
	}
	var rows = $A(this.body.rows);
	var new_sort = this.head_row.down('th.col-'+index );

	if ( this.sorted_by === new_sort ){
	    rows.reverse();
	} else {
	    var cs = this.getColumnSorter( index );
	    var order = up_down ? 1 : -1;
	    rows.sort(function(a,b) {
			  return order *
			      cs.compare( a.cells[index].innerHTML,
				  b.cells[index].innerHTML );
	    } );

	}
	rows.each(function(r,i) {
	    this.body.appendChild(r);
	    this.stripeRow(r,i);
	},this);

	new_sort.addClassName('sorted ' + ( up_down ? 'asc' : 'desc' ) );
	this.sorted_by = new_sort;

    },

    requestRows:function(){
	new Ajax.Request( this.options.get('url'),{
	    parameters: this.parameters,
	    method: 'get',
	    contentType: 'application/json;',
	    onSuccess: function(resp){
		this.appendRows( resp.responseJSON.rows );
	    }.bind(this),
	    onComplete: this.container.fire.bind( this.container, 'WonderTable:loadComplete' )
	});
    },

    numColumns: function(){
	return this.num_columns;
    },
    numRows: function(){
	return this.body.rows.length;
    },

    removeRow:function( row ){
	row.remove();
    },

    defaultRender:function( val, rows, row_num ){
	return val;
    },

    setColumnRenderer: function( col_index, func ){
	this.render[ col_index ] = func;
    },

    setHeader: function( cols ){
	this.num_columns = cols.length;
	var cell;
	for ( var i = 0; i < this.num_columns; ++i ){
	    if ( this.head_row.cells.length > i ){
		cell = this.head_row.cells[i];
		cell.update( cols[i] );
	    } else {
		cell = new Element('th' );
		cell.update( cols[i] );
		this.head_row.appendChild( cell );
	    }
	    cell.className = 'col-'+i;
	    if ( this.options.get('no_sort').include(i) ){
		cell.addClassName( 'nosort' );
	    }
	}
	for ( ; i < this.head_row.cells.length; ++i ){
	    this.head_row.deleteCell( i );
	}
    },

    htmlForRow:function( row ){
	var html = [];
	for ( var x = 0; x < this.num_columns; ++x ){
	    html.push( '<td class="col-'+x+'">' );
	    html.push( row[x] );
	    html.push( '</td>' );
	}
	return html.join('');
    },

    appendRows:function(rows){
	var html = [ this.body.innerHTML ];
	var len = rows.length;
	for ( var y = 0; y < len; y++ ) {
	    html.push( '<tr>' );
	    html.push( this.htmlForRow( rows[y] ) );
	    html.push('</tr>');
	}
	this.body.innerHTML = html.join('');
	this.setHeight();
	this.stripeRows();
    },
    stripeRows:function(){
	for ( i = 0; i<this.numRows(); i++ ){
	    var r = this.body.rows[i];
	    this.stripeRow( r, i );
	}
    },

    stripeRow: function( row, index ){
	var css = $w( row.className );
	var new_css = [];
	for(var x = 0, l = css.length; x < l; x += 1) {
	    if(css[x] !== 'even' && css[x] !== 'odd' ) {
		new_css.push(css[x]);
	    }
	}
	new_css.push( index%2 ? 'odd' : 'even' );
	row.className = new_css.join(' ');
    },

    setRows:function( rows ){
	this.body.update();
	this.appendRows( rows );

    },

    setHeight:function(){
	var height = ( this.numRows() <= 10 ) ? ( this.body.rows.length * 30 ) : 300;
	this.body.setStyle({ 'height': height +'px' } );
	this.container.setStyle({'height': (height+35) + 'px'});
    },


    layout: function(){
	this.table.setStyle({'width': ( this.container.getWidth()-35 ) + 'px' } );

    },

    scrollBottom: function(){
	return this.body.getHeight() - ( this.body.scrollHeight - this.body.scrollTop );
    },

    setColumnSorter: function(index,func){
	this.column_sorters.set( index, func );
    },


    getColumnSorter : function( index ) {
	var t  = this.column_sorters.get( index );
	if( undefined == t) {
	    var row;
	    for ( var i = 0; i < this.numRows(); i++ ){
		row = this.body.rows[i];
		if ( ! row.cells[index].innerHTML.blank() ){
		    i = this.numRows();
		}
	    }
	    if ( row ){
		t = WonderTable.detectDataType( row.cells[index].innerHTML.strip() );
		this.setColumnSorter( index, t );
	    }
	}
	return t;
    },

    column_sorters : $H()

});



WonderTable.SortType = Class.create(
{
    initialize : function(name, options){
	this.name = name;
	options = Object.extend({
				    normal : function(v){
					return v;
				    },
				    pattern : /.*/
				}, options || {});
	this.normal = options.normal;
	this.pattern = options.pattern;
	if(options.compare) {
	    this.compare = options.compare;
	}
	if(options.detect) {
	    this.detect = options.detect;
	}
    },
    compare : function(a,b){
	a = this.normal(a);
	b = this.normal(b);
	return a < b ? -1 : a === b ? 0 : 1;
    },
    detect : function(v){
	return this.pattern.test(v);
    }
});


WonderTable.sort_detectors = [];

WonderTable.addColumnSorter = function(){
    $A(arguments).each(function(o){
	WonderTable.sort_detectors.push( o );
    });
};

WonderTable.getSorterNamed = function( name ){
    return WonderTable.sort_detectors.detect( function(d){
	return ( d.name == name );
    });
};


WonderTable.detectDataType = function( data ){
    return WonderTable.sort_detectors.detect( function(d){
	return d.detect( data );
    });
};


WonderTable.addColumnSorter(
	new WonderTable.SortType('date-iso',{
		pattern : /[\d]{4}-[\d]{2}-[\d]{2}(?:T[\d]{2}\:[\d]{2}(?:\:[\d]{2}(?:\.[\d]+)?)?(Z|([-+][\d]{2}:[\d]{2})?)?)?/, // 2005-03-26T19:51:34Z
		normal : function(v) {
			if(!this.pattern.test(v)) {return 0;}
		    var d = v.match(/([\d]{4})(-([\d]{2})(-([\d]{2})(T([\d]{2}):([\d]{2})(:([\d]{2})(\.([\d]+))?)?(Z|(([-+])([\d]{2}):([\d]{2})))?)?)?)?/);
		    var offset = 0;
		    var date = new Date(d[1], 0, 1);
		    if (d[3]) { date.setMonth(d[3] - 1) ;}
		    if (d[5]) { date.setDate(d[5]); }
		    if (d[7]) { date.setHours(d[7]); }
		    if (d[8]) { date.setMinutes(d[8]); }
		    if (d[10]) { date.setSeconds(d[10]); }
		    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
		    if (d[14]) {
		        offset = (Number(d[16]) * 60) + Number(d[17]);
		        offset *= ((d[15] === '-') ? 1 : -1);
		    }
		    offset -= date.getTimezoneOffset();
		    if(offset !== 0) {
		    	var time = (Number(date) + (offset * 60 * 1000));
		    	date.setTime(Number(time));
		    }
			return date.valueOf();
		}}),
	new WonderTable.SortType('date',{
		pattern: /^(?:sun|mon|tue|wed|thu|fri|sat)\,\s\d{1,2}\s(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s\d{4}(?:\s\d{2}\:\d{2}(?:\:\d{2})?(?:\sGMT(?:[+-]\d{4})?)?)?/i, //Mon, 18 Dec 1995 17:28:35 GMT
		compare : function(a,b) { // must be standard javascript date format
			if(a && b) {
				return WonderTable.SortType.compare(new Date(a),new Date(b));
			} else {
				return WonderTable.SortType.compare(a ? 1 : 0, b ? 1 : 0);
			}
		}}),
	new WonderTable.SortType('date-us',{
		pattern : /^\d{2}\/\d{2}\/\d{4}\s?(?:\d{1,2}\:\d{2}(?:\:\d{2})?\s?[a|p]?m?)?/i,
		normal : function(v) {
			if(!this.pattern.test(v)) {return 0;}
			var r = v.match(/^(\d{2})\/(\d{2})\/(\d{4})\s?(?:(\d{1,2})\:(\d{2})(?:\:(\d{2}))?\s?([a|p]?m?))?/i);
			var yr_num = r[3];
			var mo_num = parseInt(r[1],10)-1;
			var day_num = r[2];
			var hr_num = r[4] ? r[4] : 0;
			if(r[7]) {
				var chr = parseInt(r[4],10);
				if(r[7].toLowerCase().indexOf('p') !== -1) {
					hr_num = chr < 12 ? chr + 12 : chr;
				} else if(r[7].toLowerCase().indexOf('a') !== -1) {
					hr_num = chr < 12 ? chr : 0;
				}
			}
			var min_num = r[5] ? r[5] : 0;
			var sec_num = r[6] ? r[6] : 0;
			return new Date(yr_num, mo_num, day_num, hr_num, min_num, sec_num, 0).valueOf();
		}}),
	new WonderTable.SortType('date-eu',{
		pattern : /^\d{2}-\d{2}-\d{4}/i,
		normal : function(v) {
			if(!this.pattern.test(v)) {return 0;}
			var r = v.match(/^(\d{2})-(\d{2})-(\d{4})/);
			var yr_num = r[3];
			var mo_num = parseInt(r[2],10)-1;
			var day_num = r[1];
			return new Date(yr_num, mo_num, day_num).valueOf();
		}}),
	new WonderTable.SortType('date-au',{
		pattern : /^\d{2}\/\d{2}\/\d{4}\s?(?:\d{1,2}\:\d{2}(?:\:\d{2})?\s?[a|p]?m?)?/i,
		normal : function(v) {
			if(!this.pattern.test(v)) {return 0;}
			var r = v.match(/^(\d{2})\/(\d{2})\/(\d{4})\s?(?:(\d{1,2})\:(\d{2})(?:\:(\d{2}))?\s?([a|p]?m?))?/i);
			var yr_num = r[3];
			var mo_num = parseInt(r[2],10)-1;
			var day_num = r[1];
			var hr_num = r[4] ? r[4] : 0;
			if(r[7]) {
				var chr = parseInt(r[4],10);
				if(r[7].toLowerCase().indexOf('p') !== -1) {
					hr_num = chr < 12 ? chr + 12 : chr;
				} else if(r[7].toLowerCase().indexOf('a') !== -1) {
					hr_num = chr < 12 ? chr : 0;
				}
			}
			var min_num = r[5] ? r[5] : 0;
			var sec_num = r[6] ? r[6] : 0;
			return new Date(yr_num, mo_num, day_num, hr_num, min_num, sec_num, 0).valueOf();
		}}),
	new WonderTable.SortType('time',{
		pattern : /^\d{1,2}\:\d{2}(?:\:\d{2})?(?:\s[a|p]m)?$/i,
		compare : function(a,b) {
			var d = new Date();
			var ds = d.getMonth() + "/" + d.getDate() + "/" + d.getFullYear() + " ";
			return WonderTable.SortType.compare(new Date(ds + a),new Date(ds + b));
		}}),
	new WonderTable.SortType('currency',{
		pattern : /^[$����]/, // dollar,pound,yen,euro,generic currency symbol
		normal : function(v) {
			return v ? parseFloat(v.replace(/[^-\d\.]/g,'')) : 0;
		}}),
	new WonderTable.SortType('datasize',{
		pattern : /^[-+]?[\d]*\.?[\d]+(?:[eE][-+]?[\d]+)?\s?[k|m|g|t]b$/i,
		normal : function(v) {
			var r = v.match(/^([-+]?[\d]*\.?[\d]+([eE][-+]?[\d]+)?)\s?([k|m|g|t]?b)?/i);
			var b = r[1] ? Number(r[1]).valueOf() : 0;
			var m = r[3] ? r[3].substr(0,1).toLowerCase() : '';
			var result = b;
			switch(m) {
				case  'k':
					result = b * 1024;
					break;
				case  'm':
					result = b * 1024 * 1024;
					break;
				case  'g':
					result = b * 1024 * 1024 * 1024;
					break;
				case  't':
					result = b * 1024 * 1024 * 1024 * 1024;
					break;
			}
			return result;
		}}),
    new WonderTable.SortType('number', {
		pattern : /^[-+]?[\d]*\.?[\d]+(?:[eE][-+]?[\d]+)?/,
		normal : function(v) {
			// This will grab the first thing that looks like a number from a string, so you can use it to order a column of various srings containing numbers.
			v = parseFloat(v.replace(/^.*?([-+]?[\d]*\.?[\d]+(?:[eE][-+]?[\d]+)?).*$/,"$1"));
			return isNaN(v) ? 0 : v;
		}}),
	new WonderTable.SortType('casesensitivetext',{pattern : /^[A-Z]+$/}),

	new WonderTable.SortType('text',{
		normal : function(v) {
			return v ? v.toLowerCase() : '';
		}})
);

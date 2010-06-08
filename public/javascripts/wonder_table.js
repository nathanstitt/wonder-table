WonderTable = Class.create(
{

    initialize: function(el, options ){
	this.options = $H({
	    'sort': true,
	    'id_column': 0,
	    'loading_text': 'Loading...',
	    'no_sort': []
	}).merge( options );
	this.id_column = this.options.get('id_column');

	this.rows = new Hash();
	this.celldrawers=[];
	this.parameters = $H( this.options.get('parameters') );
	this.container = new Element('div',{ className:'wonder'} );
	$(el).insert(this.container);

	if ( this.options.get('loading_text') ){
	    this.spinner = new Element('div', { className: 'spinner' } );
	    this.spinner.hide();
	    this.spinner_text = new Element('p');
	    this.spinner_text.update( this.options.get('loading_text') );
	    this.spinner.insert( this.spinner_text );
	    this.container.insert( this.spinner );
	}

	this.header = new Element('div',{className:'header'});
//	var div = new Element('div',{className:'label-container'});
//	div.insert( this.header );
	this.container.insert( this.header );

	this.scroller = new Element('div',{className:'scroll'});
	this.container.insert( this.scroller );

	this.footer = new Element('div',{className:'footer'});
//	div = new Element('div',{className:'label-container'});
//	div.insert( this.footer );
//	this.container.insert( div );
	this.container.insert( this.footer );


	this.table = new Element('table',{className:'rows'});
	this.body = new Element('tbody');
	this.table.insert( this.body );
	this.scroller.insert( this.table );

	this.scroller.observe('scroll', function(ev){
	    if ( ( this.scrollBottom() / this.scroller.scrollHeight ) < 0.10 ){
		if ( ! ev.target.fire('wonder-table:scroll-bottom', { 'remaining' :  this.scrollBottom()  } ).stopped
	    	     && this.options.get('url')
		     && ! this.all_loaded ){
		    this.requestAdditionalRows();
		}
	    }
	}.bind(this) );

	this.body.on('click', 'td', function(ev){
	    var tr = ev.target.up('tr');
	    if ( this.selected ){
		if ( tr == this.selected ){
		    this.unSelect();
		    return;
		} else if ( ! this.unSelect() ){
		    return;
		}
	    }
	    if ( ! tr.fire('wonder-table:selected', {
				   'target': ev.target,
				   'row': tr,
				   'data':this.getRowData(tr),
				   'cell': ev.findElement('td')
			   } ).stopped ){
		this.selected = tr;
		this.selected.addClassName('selected');
	    }
	}.bind(this) );

	if ( ( header = this.options.get('header') ) ){
	    this.setHeader( header );
	}

	if ( ( footer = this.options.get('footer') ) ){
	    this.setFooter( footer );
	}

	this.footer.on('click', 'div', function(ev){
		var index = this.footer.childElements().indexOf( ev.target );
		if ( ! this.selected.fire('wonder-table:footer-clicked', { columnIndex: index } ).stopped && this.options.get('sort') ){
		    this.sortByColumn( index, ! ev.target.hasClassName('asc') );
		}
	}.bind(this) );

	this.header.on('click', 'div', function(ev){
		var index = this.header.childElements().indexOf( ev.target );
		if ( ! this.selected.fire('wonder-table:header-clicked', { columnIndex: index } ).stopped && this.options.get('sort') ){
		    this.sortByColumn( index, ! ev.target.hasClassName('asc') );
		}
	}.bind(this) );

    },

    avgColumn:function(index){
	return this.sumColumn( index ) / this.numRows();
    },

    sumColumn:function(index){
	var sorter = this.getColumnSorter( index );
	var ret = 0;
	this.body.select('td.col-'+index).each(function(el){ ret += sorter.normal(el.innerHTML); });
	return ret;
    },
    unSelect:function(){
	if ( ! this.selected ){
	    return false;
	}
	if ( this.selected.fire('wonder-table:unselected', { row: this.selected, data: this.getRowData( this.selected )  } ).stopped ){
	    return false;
	}
	this.selected.removeClassName('selected');
	this.selected = null;
	return true;
    },

    clear:function(){
	this.body.update();
    },

    reload: function(){
 	this.clear();
 	this.requestRows();
    },

    sortByColumn:function( index, up_down ){
	if ( this.options.get('no_sort').include( index ) ){
	    return;
	}
	if ( this.sorted_by ){
	    this.sorted_by.removeClassName( 'sorted').removeClassName('asc').removeClassName('desc');
	}
	var rows = $A(this.body.rows);
	var new_sort = this.header.children[ index ];

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

    requestAdditionalRows:function(){
	this.requestRows();
    },

    setLoading:function(){
	if ( this.loading || this.container.fire( 'wonder-table:before-loading' ).stopped  ){
	    return  false;
	}
	if ( this.spinner ){
	    var l = new Element.Layout( this.scroller );
	    this.spinner.setStyle({ 'top': l.get('top')+'px', 'height': l.get('border-box-height') + 'px', 'width': l.get('border-box-width') + 'px' });
	    this.spinner_text.setStyle({ 'margin': ( this.scroller.getHeight() / 2 )-30 + 'px auto 0px' } );
	    this.spinner.show();
	}
	this.loading = true;
	return true;
    },

    afterLoading: function(){
	this.loading=false;
	if ( this.spinner ){
	    this.spinner.hide();
	}
	this.body.fire( 'wonder-table:after-loading' );
    },

    requestRows:function(){
	if ( ! this.setLoading() ){
	    return;
	}
	if ( ( limit = this.options.get('limit') ) ){
	    this.parameters = $H(this.parameters).merge({
		'offset': this.numRows(),
		'limit': limit
	    });
	}
	if ( this.sorted_by ){
	    this.parameters = $H(this.parameters).merge({
		'dir': this.sorted_by.hasClassName('asc') ? 'asc' : 'desc',
		'sort': this.sorted_by.innerHTML
	    });
	}
	new Ajax.Request( this.options.get('url'),{
	    parameters: this.parameters,
	    method: 'get',
	    contentType: 'application/json;',
	    onSuccess: this.appendResponse.bind(this),
	    onFailure: this.afterLoading.bind(this)
	});
    },

    appendResponse:function(resp){
	if ( resp.responseJSON && resp.responseJSON.rows && resp.responseJSON.rows.length ){
	    this.appendRows( resp.responseJSON.rows );
	} else {
	    this.all_loaded=true;
	}
	this.afterLoading();
    },

    numColumns: function(){
	return this.num_columns;
    },

    updateRow: function( rowIndex, data ){
	var row = $( this.body.rows[ rowIndex ] );
	row.update( this.htmlForRow( data ) );
	return row;
    },

    prependRow: function(){
	return $( this.body.insertRow( 0 ) );
    },

    numRows: function(){
	return this.body.rows.length;
    },

    removeRow:function( row ){
	row.remove();
	this.afterUpdate();
	if ( this.selected == row ){
	    this.selected = null;
	}
    },

    setFooter: function( cols ){
	if ( this.num_columns && this.num_columns != cols.length ){
	    throw "Number of footer columns must match number of header columns"
	}
	this.footer_set = true;
	this._setLabels( cols, this.footer );
    },

    _setLabels:function(cols, div ){
	this.num_columns = cols.length;
	var cell;
	for ( var i = 0; i < this.num_columns; ++i ){
	    if ( div.children.length > i ){
		cell = div.children[i];
		cell.update( cols[i] );
	    } else {
		cell = new Element('div' );
		cell.update( cols[i] );
		div.appendChild( cell );
	    }
	    cell.className = 'col-'+i;
	    if ( this.options.get('no_sort').include(i) ){
		cell.addClassName( 'nosort' );
	    }
	}
	for ( ; i < div.children.length; ++i ){
	    div.children[i].remove();
	}
	div.children[ this.num_columns-1 ].addClassName('last');
    },

    setHeader: function( cols ){
	this._setLabels( cols, this.header );
    },

    setCellDrawer: function( index, func ){
	this.celldrawers[index] = func;
    },

    defaultCellDrawer: function(txt){
	return txt;
    },

    htmlForRow:function( row ){
	var html = [];
	for ( var x = 0; x < this.num_columns; ++x ){
	    html.push( '<td class="col-'+x+'">' );
	    html.push( ( this.celldrawers[x] || this.defaultCellDrawer )( row[x], row ) );
	    html.push( '</td>' );
	}
	return html.join('');
    },

    getRowData:function(tr){
	return this.getData( tr.readAttribute('recid') );
    },

    getData: function( id ){
	return this.rows.get( id );
    },

    rowAttributes:function(row){
	return 'recid="' + row[ this.id_column ] + '"';
    },

    appendRows:function(rows){
	if ( this.body.fire( 'wonder-table:before-append', rows ).stopped ){
	    return;
	}
	var html = [ this.body.innerHTML ];
	var len = rows.length;
	for ( var y = 0; y < len; y++ ) {
	    this.rows.set( rows[y][ this.id_column ], rows[y] );
	    html.push( '<tr ' );
	    html.push( this.rowAttributes( rows[y] ) );
	    html.push( '>' );
	    html.push( this.htmlForRow( rows[y] ) );
	    html.push('</tr>');
	}
	this.body.update( html.join('') );
	this.afterUpdate();
	this.stripeRows();
	this.body.fire('wonder-table:after-append',{'table':this});
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
	this.rows = new Hash();
	this.clear();
	this.appendRows( rows );
    },

    afterUpdate:function(){
	var height = ( this.numRows() <= 10 ) ? ( this.body.rows.length * 30 ) : 300;
	this.scroller.setStyle({'height': (height+65) + 'px'});
	if ( this.sorted_by ){
	    this.sorted_by.removeClassName( 'sorted').removeClassName('asc').removeClassName('desc');
	    this.sorted_by = null;
	}
	this.updateLabelWidths();
    },

    updateLabelWidths: function(){
	if ( ! this.num_columns ){
	    return;
	}
	var row = this.body.rows[0];
	var layout;
	if ( ! row ){
	    return;
	}
	var col = 0;
	for ( ; col<this.num_columns; col++ ){

 	    layout = row.cells[ col ].getLayout();
	    var style = { 'left': ( col ?  layout.get('left') : 0 ) +'px' };
	    if ( col < this.num_columns-1 ){
		style[ 'width' ] = ( col ? layout.get('padding-box-width') : layout.get('padding-box-width') + (layout.get('padding-left')/2) ) + 'px';
//+ ( col ? 0 : ( layout.get('padding-left')  ) ) ) + 'px';
	    }
 	    this.header.children[ col ].setStyle( style );
 	    if ( this.footer_set ){
 	    	this.footer.children[ col ].setStyle( style );
 	    }

	    // var w = row.cells[col].getWidth();
	    // this.header.children[ col ].setStyle({'width': w + 'px' } );
	    // if ( this.footer_set ){
	    // 	this.footer.children[ col ].setStyle({'width': w + 'px' } );
	    // }
	}
	// layout = row.cells[ col ].getLayout();
	// this.header.children[ col ].setStyle({'left':( layout.get('left') ) + 'px' });
	// if ( this.footer_set ){
	//     this.footer.children[ col ].setStyle({'left':( layout.get('left')+layout.get('margin-box-width') ) + 'px' });
	// }
    },

    scrollBottom: function(){
	return -1 * ( this.scroller.getHeight() - ( this.scroller.scrollHeight - this.scroller.scrollTop ) );
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
	    pattern : /^[-+]?[\d|,]*\.?[\d]+(?:[eE][-+]?[\d]+)?/,
	    normal : function(v) {
		// This will grab the first thing that looks like a number from a string,
		// so you can use it to order a column of various srings containing numbers.
		v = parseFloat( v.replace(/^.*?([-+]?[\d|,]*\.?[\d]+(?:[eE][-+]?[\d]+)?).*$/,"$1").replace(',','') );
		return isNaN(v) ? 0 : v;
	    }}),
	new WonderTable.SortType('casesensitivetext',{pattern : /^[A-Z]+$/}),

	new WonderTable.SortType('text',{
		normal : function(v) {
			return v ? v.toLowerCase() : '';
		}})
);

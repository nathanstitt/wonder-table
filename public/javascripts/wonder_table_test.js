jsUnity.attachAssertions();

Test = {
    init: function(){


	this.log = $('test-logs');
	jsUnity.log = function (s) {
	    this.log.insert({'top': '<li>' + s + '</li>' } );
	}.bind(this);
	this.container = $('test-table');

	this.table = new WonderTable( this.container, {
					  'header': $w('BADCOLUMN_NAME Complete Due Description FooNoShow'),
					  'url': '/data.json',
					  'limit': 100
				      });

	jsUnity.run( this.testHeader );
	jsUnity.run( this.testFooter );

	this.table.requestRows();
	this.container.observe('wonder-table:after-loading', function(){
				    	jsUnity.run( this.testSorting );
			       }.bind(this));

	this.container.observe('wonder-table:scroll-bottom', function(ev){
				   jsUnity.log('near bottom, ' + ev.memo.remaining + ' remains');
			       }.bind(this));

	this.container.observe('wonder-table:selected', function(ev){
				   jsUnity.log( "Row " + ev.memo.row.rowIndex + " selected");
			       }.bind(this));
	this.container.observe('wonder-table:unselected', function(ev){
				   jsUnity.log( "Row " + ev.memo.row.rowIndex + " unselected");
			       }.bind(this));
    },

    testFooter: {
	suiteName: "Footer Change Tests",
	testCountMatch:function() {
	    assertException( function(){
				 Test.table.setFooter( ['None'] );
			     } );
	},
	testAfter:function () {
	    Test.table.setFooter( $w('Delete Complete Due Description Status') );
	    assertMatch( /Delete/, $$('.footer div.col-0')[0].innerHTML );
	    assertEqual( 5, $$('.footer div').length );
	}
    },

    testHeader: {
	suiteName: "Header Change Tests",
	testBefore:function() {
	    assertMatch( /BAD/, $$('.header div.col-0')[0].innerHTML );
	},
	testAfter:function () {
	    Test.table.setHeader( $w('Delete Complete Due Description Status') );
	    assertMatch( /Delete/, $$('.header div.col-0')[0].innerHTML );
	    assertEqual( 5, $$('.header div').length );
	}
    },

    testSorting: {
	suiteName: "Sorting Tests",

	testSortingNumeric:function() {
	    for ( col_index = 0; col_index < 3; col_index++ ){
		Test.table.sortByColumn( col_index, true );
		assertTrue( getIntc(0,col_index) < getIntc( Test.table.numRows()-1,col_index),
			    '"' + getIntc(0,col_index) + '" < "' + getIntc( Test.table.numRows()-1,col_index) + '"' );
		Test.table.sortByColumn( col_index, false );
		assertTrue( getIntc(0,col_index) > getIntc( Test.table.numRows()-1,col_index),
			    '"' + getIntc(0,col_index) + '" > "' + getIntc( Test.table.numRows()-1,col_index) + '"' );
	    }
	},
	testSortingDate:function(){
	    var col_index = 2;
	    Test.table.sortByColumn( col_index, true );
	    assertTrue( new Date( getC(0,col_index) ) < new Date( getC( Test.table.numRows()-1,col_index) ),
			'"' + getC(0,col_index) + '" < "' + getC( Test.table.numRows()-1,col_index) + '"' );
	    Test.table.sortByColumn( col_index, false );
	    assertTrue( new Date( getC(0,col_index) ) > new Date( getC( Test.table.numRows()-1,col_index) ),
			'"' + getC(0,col_index) + '" > "' + getC( Test.table.numRows()-1,col_index) + '"' );

	},
	testSortingString:function() {
	    for ( col_index = 3; col_index < 5; col_index++ ){
		Test.table.sortByColumn( col_index, true );
		assertTrue( getLCc(0,col_index) < getLCc( Test.table.numRows()-1,col_index),
			    '"' + getLCc(0,col_index) + '" < "' + getLCc( Test.table.numRows()-1,col_index) + '"' );
		Test.table.sortByColumn( col_index, false );
		assertTrue( getLCc(0,col_index) > getLCc( Test.table.numRows()-1,col_index),
			    '"' + getLCc(0,col_index) + '" > "' + getLCc( Test.table.numRows()-1,col_index) + '"' );
	    }
	}
    }
};

function getIntc( row, index ){
    return parseFloat( Test.table.body.rows[ row ].cells[index].innerHTML );
}

function getLCc( row, index ){
    return Test.table.body.rows[ row ].cells[index].innerHTML.toLowerCase();
}

function getC( row, index ){
    return Test.table.body.rows[ row ].cells[index].innerHTML;
}
jsUnity.attachAssertions();

Test = {
    init: function(){


	this.log = $('test-logs');
	jsUnity.log = function (s) {
	    this.log.insert({'bottom': '<li>' + s + '</li>' } );
	}.bind(this);
	this.container = $('test-table');

	this.table = new WonderTable( this.container, {
					  'header': $w('BADCOLUMN_NAME Complete Due Description FooNoShow'),
					  'url': '/data.json',
					  'parameters': {
					      'limit': 30
					  }
				     });
	this.container.observe('WonderTable:loadComplete', function(){
				   jsUnity.run( this.testHeader, this.testSorting );
			       }.bind(this));


    },

    testHeader: {
	suiteName: "Header Change Tests",
	testBefore:function() {
	    assertMatch( /BAD/, $$('thead th.col-0')[0].innerHTML );
	},
	testAfter:function () {
	    Test.table.setHeader( $w('Delete Complete Due Description Status') );
	    assertMatch( /Delete/, $$('thead th.col-0')[0].innerHTML );
	    assertEqual( 5, $$('thead th').length );
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
	},
	testLoading: function(){
	    assertEqual( 30, Test.table.numRows() );
	    // Test.table.parameters.set('limit',300 );
	    // Test.table.requestRows();
	    // Test.container.observe('WonderTable:loadComplete', function(){
	    // 	assertEqual( 330, Test.table.numRows() );
	    // });
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
/* eslint-disable no-console */

var chai = require( 'chai' );
var mocha = require( 'mocha' );
var ner = require( '../src/wink-ner.js' );

var expect = chai.expect;
var describe = mocha.describe;
var it = mocha.it;

describe( 'instantiate ner', function () {
  it( 'must return 7 methods', function () {
      expect( Object.keys( ner() ).length ).to.equal( 7 );
  } );
} );

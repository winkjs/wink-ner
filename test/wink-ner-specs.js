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

describe( 'simple training & detection', function () {
  var n = ner();
  var trainingData = [
    { text: 'raw banana', entityType: 'veg' },
    { text: 'banana', entityType: 'fruit' },
  ];
  var tokens = [
    { value: 'get', tag: 'word' },
    { value: 'me', tag: 'word' },
    { value: 'some', tag: 'word' },
    { value: 'raw', tag: 'word' },
    { value: 'bananas', tag: 'word' },
    { value: 'bananas', tag: 'word' }
  ];

  var result = [
    { value: 'get', tag: 'word' },
    { value: 'me', tag: 'word' },
    { value: 'some', tag: 'word' },
    { entityType: 'veg', originalSeq: [ 'raw', 'bananas' ], uid: 'raw_banana', value: 'raw banana', tag: 'word' },
    { value: 'banana', tag: 'word', originalSeq: [ 'bananas' ], uid: 'banana', entityType: 'fruit' }
];
  it( 'basic training with 2 entities', function () {
      expect( n.learn( trainingData ) ).to.equal( 2 );
  } );

  it( 'detect *banana* & *raw banana* as entities', function () {
      expect( n.recognize( tokens ) ).to.deep.equal( result );
  } );
} );

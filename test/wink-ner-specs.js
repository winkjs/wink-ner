//     wink-ner
//     Language agnostic named entity recognizer
//
//     Copyright (C) 2017-19  GRAYPE Systems Private Limited
//
//     This file is part of “wink-ner”.
//
//     Permission is hereby granted, free of charge, to any person obtaining a
//     copy of this software and associated documentation files (the "Software"),
//     to deal in the Software without restriction, including without limitation
//     the rights to use, copy, modify, merge, publish, distribute, sublicense,
//     and/or sell copies of the Software, and to permit persons to whom the
//     Software is furnished to do so, subject to the following conditions:
//
//     The above copyright notice and this permission notice shall be included
//     in all copies or substantial portions of the Software.
//
//     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
//     OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
//     THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//     LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
//     FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
//     DEALINGS IN THE SOFTWARE.

/* eslint-disable no-console */

var chai = require( 'chai' );
var mocha = require( 'mocha' );
var ner = require( '../src/wink-ner.js' );
var t = require( 'wink-tokenizer' )().tokenize;

var expect = chai.expect;
var describe = mocha.describe;
var it = mocha.it;

var learnings = '[{"tagsToIgnore":{},"valuesToIgnore":{},"ignoreDiacritics":false},{"raw":{"entityType":"org","wordCounts":[2]},"banana":{"entityType":"fruit"}},{"raw banana":{"entityType":"veg"}},{},[],[]]';

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
    { text: 'raw apple', entityType: 'fruit' },
    { txt: 'aa', entity: 'cc' }
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
    expect( n.learn( trainingData ) ).to.equal( 3 );
  } );

  it( 'detect *banana* & *raw banana* as entities', function () {
    expect( n.recognize( tokens ) ).to.deep.equal( result );
  } );
} );

describe( 'defineConfig() testing', function () {
  var n = ner();
  var trainingData = [
    { text: 'raw banana', entityType: 'veg' },
    { text: 'banana', entityType: 'fruit' },
    { text: 'raw', entityType: 'org' }
  ];
  var result;
  it( 'must return empty config', function () {
    result = { tagsToIgnore: [ ], valuesToIgnore: [], ignoreDiacritics: false };
    expect( n.defineConfig( { tagsToIgnore: [ ], ignoreDiacritics: false } ) ).to.deep.equal( result );
  } );

  it( 'must return 3 with training data', function () {
    expect( n.learn( trainingData ) ).to.equal( 3 );
  } );

  it( 'must return correct learnings on export', function () {
    expect( n.exportJSON( ) ).to.deep.equal( learnings );
  } );

  it( 'must not ignore anything', function () {
    result = [
      { value: 'raw', tag: 'word', originalSeq: [ 'raw' ], uid: 'raw', entityType: 'org' },
      { value: '-', tag: 'punctuation' },
      { value: 'banana', tag: 'word', originalSeq: [ 'banana' ], uid: 'banana', entityType: 'fruit' },
      { value: 'is', tag: 'word' },
      { value: 'good', tag: 'word' },
      { value: 'for', tag: 'word' },
      { value: 'health', tag: 'word' }
    ];
    // Since last config is empty, it can not detect 'raw banana' as an entity;
    // instead it will just detect raw as an org!
    expect( n.recognize( t( 'raw-banana is good for health' ) ) ).to.deep.equal( result );
  } );
} );

describe( 'defineConfig() exceptions/special conditions', function () {
  var n = ner();
  it( 'empty config object shoud restore default config', function () {
    expect( n.defineConfig( {} ) ).to.deep.equal( { tagsToIgnore: [ 'punctuation' ], valuesToIgnore: [], ignoreDiacritics: true } );
  } );

  it( 'should throw error if config is not defined', function () {
    expect( n.defineConfig.bind( null ) ).to.throw( 'wink-ner/defineConfig: config must be an object, instead found: undefined' );
  } );

  it( 'should throw error if valuesToIgnore is not an array', function () {
    // Sending **1** to ensure truthy value!
    expect( n.defineConfig.bind( null, { valuesToIgnore: 1 } ) ).to.throw( 'wink-ner/defineConfig: valuesToIgnore must be an array, instead found: 1' );
  } );

  it( 'should throw error if tagsToIgnore is not an array', function () {
    // Sending **1** to ensure truthy value!
    expect( n.defineConfig.bind( null, { tagsToIgnore: 1 } ) ).to.throw( 'wink-ner/defineConfig: tagsToIgnore must be an array, instead found: 1' );
  } );

  it( 'should throw error if tagsToIgnore does not contain string', function () {
    // Sending **1** to ensure truthy value!
    expect( n.defineConfig.bind( null, { tagsToIgnore: [ 1 ] } ) ).to.throw( 'wink-ner/defineConfig: tagsToIgnore must contain strings, instead found: [1]' );
  } );

  it( 'should only consider valid tags', function () {
    // **word** is not valid here, whereas **email** is!
    expect( n.defineConfig( { tagsToIgnore: [ 'email', 'word' ] } ) ).to.deep.equal( { tagsToIgnore: [ 'email' ], valuesToIgnore: [], ignoreDiacritics: true } );
  } );

  it( 'should throw error if valuesToIgnore does not contain string', function () {
    // Sending **1** to ensure truthy value!
    expect( n.defineConfig.bind( null, { valuesToIgnore: [ 1 ] } ) ).to.throw( 'wink-ner/defineConfig: valuesToIgnore must contain strings, instead found: [1]' );
  } );

  it( 'should accept any string value', function () {
    // **word** is not valid here, whereas **email** is!
    expect( n.defineConfig( { valuesToIgnore: [ 'limited' ] } ) ).to.deep.equal( { tagsToIgnore: [], valuesToIgnore: [ 'limited' ], ignoreDiacritics: true } );
  } );
} );

describe( 'acronyms', function () {
  var trainingData = [
    { text: 'u s a', entityType: 'country', uid: 'usa' },
    { text: 'u k', entityType: 'country', uid: 'uk' }
  ];
  var n = ner();
  it( 'must detect USA and UK properly', function () {
    var result = [
      { entityType: 'country', uid: 'usa', originalSeq: [ 'U', 'S', 'A' ], value: 'u s a', tag: 'word' },
        { value: 'and', tag: 'word' },
        { entityType: 'country', uid: 'uk', originalSeq: [ 'U', '.', 'K' ], value: 'u k', tag: 'word' },
        { value: '.', tag: 'punctuation' },
        { value: 'are', tag: 'word' },
        { value: 'countries', tag: 'word' },
        { value: '.', tag: 'punctuation' }
    ];
    expect( n.learn( trainingData ) ).to.equal( 2 );
    expect( n.recognize( t( 'U S A and U. K. are countries.' ) ) ).to.deep.equal( result );
  } );
} );

describe( 'multi-word entity test', function () {
  var n = ner();
  var trainingData = [
    { text: 'raw banana', entityType: 'veg' },
    { text: 'banana', entityType: 'fruit' },
    { text: 'raw', entityType: 'org' }
  ];
  var result;

  it( 'must return 3 with training data', function () {
    expect( n.learn( trainingData ) ).to.equal( 3 );
  } );


  it( 'must distinguish between raw banana (veg) and raw (org)', function () {
    result = [
      { value: 'raw banana', tag: 'word', originalSeq: [ 'raw', '-', 'banana' ], uid: 'raw_banana', entityType: 'veg' },
      // { value: 'banana', tag: 'word', originalSeq: [ 'banana' ], uid: 'banana', entityType: 'fruit' },
      { value: 'is', tag: 'word' },
      { value: 'good', tag: 'word' },
      { value: 'for', tag: 'word' },
      { value: 'raw', tag: 'word', originalSeq: [ 'raw' ], uid: 'raw', entityType: 'org' },
      { value: 'employees', tag: 'word' }
    ];
    // Since last config is empty, it can not detect 'raw banana' as an entity;
    // instead it will just detect raw as an org!
    expect( n.recognize( t( 'raw-banana is good for raw employees' ) ) ).to.deep.equal( result );
  } );

  it( 'must return 2 with the revised training data', function () {
    expect( n.reset() ).to.equal( true );
    expect( n.learn( trainingData.slice( 0, 2 ) ) ).to.equal( 2 );
  } );

  it( 'must distinguish between raw banana (veg) and raw (word - non entity)', function () {
    result = [
      { value: 'raw banana', tag: 'word', originalSeq: [ 'raw', '-', 'banana' ], uid: 'raw_banana', entityType: 'veg' },
      // { value: 'banana', tag: 'word', originalSeq: [ 'banana' ], uid: 'banana', entityType: 'fruit' },
      { value: 'should', tag: 'word' },
      { value: 'not', tag: 'word' },
      { value: 'be', tag: 'word' },
      { value: 'eaten', tag: 'word' },
      { value: 'raw', tag: 'word' }
    ];
    // Since last config is empty, it can not detect 'raw banana' as an entity;
    // instead it will just detect raw as an org!
    expect( n.recognize( t( 'raw-banana should not be eaten raw' ) ) ).to.deep.equal( result );
  } );
} );

describe( 'json import', function () {
  var n = ner();

  var result = [
    { value: 'raw', tag: 'word', originalSeq: [ 'raw' ], uid: 'raw', entityType: 'org' },
    { value: '-', tag: 'punctuation' },
    { value: 'banana', tag: 'word', originalSeq: [ 'banana' ], uid: 'banana', entityType: 'fruit' },
    { value: 'is', tag: 'word' },
    { value: 'good', tag: 'word' },
    { value: 'for', tag: 'word' },
    { value: 'health', tag: 'word' }
  ];

  it( 'should throw error if input json is undefined', function () {
    expect( n.importJSON.bind( null ) ).to.throw( 'wink-ner: undefined or null JSON encountered, import failed!' );
  } );

  it( 'should throw error if input json non-string', function () {
    expect( n.importJSON.bind( null, {} ) ).to.throw( 'wink-ner: invalid JSON structure encountered, can not import.' );
  } );

  it( 'should throw error if input json non-array', function () {
    expect( n.importJSON.bind( null, '{}' ) ).to.throw( 'wink-ner: invalid JSON format encountered, can not import.' );
  } );

  it( 'should throw error if input json is an empty array', function () {
    expect( n.importJSON.bind( null, '[]' ) ).to.throw( 'wink-ner: invalid JSON format encountered, can not import.' );
  } );

  it( 'should throw error if input json has invalid length', function () {
    expect( n.importJSON.bind( null, '[ 3, 2 ]' ) ).to.throw( 'wink-ner: invalid JSON format encountered, can not import.' );
  } );

  it( 'should throw error if input json has invalid length', function () {
    expect( n.importJSON.bind( null, '[ 3, 2, 4, 3, 2, 1 ]' ) ).to.throw( 'wink-ner: invalid JSON element encountered, can not import.' );
  } );

  it( 'should import successfully correct input json', function () {
    expect( n.importJSON( learnings ) ).to.equal( true );
    expect( n.recognize( t( 'raw-banana is good for health' ) ) ).to.deep.equal( result );
  } );
} );

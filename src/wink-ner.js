//     wink-ner
//     Language agnostic named entity recognizer
//
//     Copyright (C) 2017-20  GRAYPE Systems Private Limited
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

//
var singularize = require( 'wink-lemmatizer' ).lemmatizeNoun;
var helpers = require( 'wink-helpers' );

// ### ner
/**
 *
 * Creates an instance of {@link NER}.
 *
 * @return {NER} object conatining set of API methods for named entity
 * training, recognition, etc.
 * @example
 * // Load wink ner.
 * var ner = require( 'wink-ner' );
 * // Create your instance of wink ner.
 * var myNER = ner();
*/
var ner = function () {

  /**
   * @classdesc NER class
   * @class NER
   * @hideconstructor
   */
  var methods = Object.create( null );
  // Configuration - what tags or values to ignore during recognition phase.
  var cfg = Object.create( null );
  // Learning from single word entities and the first word of multi-word entities
  // goes here. For multi-words entity, the first word goes here; and the word count
  // is pushed into a words-count array. This array may have multiple entries if
  // the first word is common between multiple wluti-word entities. Similarly
  // if the first word is shared between a single word and multi-word entities,
  // then this will contain the properties of the single word entity also.
  // The array of word-counts is sorted in descending order — thus giving preference
  // to longest word-length entity during detection.
  var uniWordEntities = Object.create( null );
  // Learning from multiple word entities goes here.
  var multiWordEntities = Object.create( null );

  // ### defineConfig
  /**
   *
   * Defines the criteria to ignore one or more
   * [**tokens**](http://winkjs.org/wink-tokenizer/) during entity detection.
   * The criteria is specified in terms of array of specific **tags** and/or **values**
   * to ignore; this means if any of the listed tag or value is found in a token,
   * it is ignored and it’s value is not considered during entity recognition.
   *
   * For example by including `punctuation`  in the array of tags to ignore,
   * tokens containing punctuations like `-` or `.` will be skipped. This will
   * result in recognition of **kg** and **k.g.** as **kg** (kilogram symbol)
   * or **Guinea-Bissau** and **Guinea Bissau** as **Guinea-Bissau**
   * (a country in West Africa).
   *
   * @method NER#defineConfig
   * @param {object} config — defines the `values` and/or `tags` to be ignore
   * during entity detection. Note if the match occurs in any one of the array,
   * the token is ignored.
   *
   * *An empty config object is equivalent to setting default configuration.*
   *
   * The table below details the properties of `config` object:
   * @param {string[]} [config.valuesToIgnore=undefined] contains **values**
   * to be ignored.
   * @param {string[]} [config.tagsToIgnore=[ 'punctuation' ]] contains **tags**
   * to be ignored. Duplicate and invaid tags, if any, are ignored.
   * Note: `number` and `word` tags can never be ignored.
   * @param {string[]} [config.ignoreDiacritics=true] a `true` ensures that diacritic
   * marks are ignored, whereas `false` will ensure that they are not ignored.
   * @return {object} a copy of configuration defined.
   * @throws {error} if `valuesToIgnore` is not an array of strings.
   * @throws {error} if `tagsToIgnore` is not an array of strings.
   * @example
   * // Do not ignore anything!
   * myNER.defineConfig( { tagsToIgnore: [], ignoreDiacritics: false } );
   * // -> { tagsToIgnore: [], valuesToIgnore: [], ignoreDiacritics: false }
   *
   * // Ignore only '-' and '.'
   * myNER.defineConfig( {
   *   tagsToIgnore: [],
   *   valuesToIgnore: [ '-', '.' ],
   *   ignoreDiacritics: false
   * } );
   * // -> {
   * //      tagsToIgnore: [],
   * //      valuesToIgnore: [ '-', '.' ],
   * //      ignoreDiacritics: false
   * //    }
  */
  var defineConfig = function ( config ) {
    // Check if `config` is a valid object.
    if ( !helpers.validate.isObject( config ) ) {
      throw Error( 'wink-ner/defineConfig: config must be an object, instead found: ' + JSON.stringify( config ) );
    }
    // Check if `valuesToIgnore` is an array provided it is a truthy.
    if ( config.valuesToIgnore && !helpers.validate.isArray( config.valuesToIgnore ) ) {
      throw Error( 'wink-ner/defineConfig: valuesToIgnore must be an array, instead found: ' + JSON.stringify( config.valuesToIgnore ) );
    }
    // Check if `tagsToIgnore` is an array provided it is a truthy.
    if ( config.tagsToIgnore && !helpers.validate.isArray( config.tagsToIgnore ) ) {
      throw Error( 'wink-ner/defineConfig: tagsToIgnore must be an array, instead found: ' + JSON.stringify( config.tagsToIgnore ) );
    }

    var validTags = Object.create( null );
    // Valid tags to exclude `number` and `word` tags.
    validTags.emoticon = true;
    validTags.email = true;
    validTags.emoji = true;
    validTags.hashtag = true;
    validTags.mention = true;
    validTags.quoted_phrase = true; // eslint-disable-line camelcase
    validTags.currency = true;
    validTags.time = true;
    validTags.url = true;
    validTags.unknown = true;
    validTags.symbol = true;

    cfg.tagsToIgnore = Object.create( null );
    cfg.valuesToIgnore = Object.create( null );
    if ( Object.keys( config ).length === 0 ) {
      // Empty `config` means, restore default configuration!
      cfg.tagsToIgnore.punctuation = true;
      cfg.ignoreDiacritics = true;
    } else {
      // Configure diacritics.
      if ( config.ignoreDiacritics !== undefined ) cfg.ignoreDiacritics =  !!config.ignoreDiacritics;

      // Configure tags to ignore.
      let ignore = config.tagsToIgnore;
      if ( ignore ) {
        for ( let i = 0; i < ignore.length; i += 1 ) {
          const key = ignore[ i ];
          if ( key && ( typeof key !== 'string' ) ) {
            throw Error( 'wink-ner/defineConfig: tagsToIgnore must contain strings, instead found: ' + JSON.stringify( ignore ) );
          }
          // Include only valid tags; others are ignored.
          if ( validTags[ key ] ) cfg.tagsToIgnore[ key ] = true;
        }
      } // if ( !ignore )...
      // Configure values to ignore.
      ignore = config.valuesToIgnore;
      if ( ignore ) {
        for ( let i = 0; i < ignore.length; i += 1 ) {
          const key = ignore[ i ];
          if ( key && ( typeof key !== 'string' ) ) {
            throw Error( 'wink-ner/defineConfig: valuesToIgnore must contain strings, instead found: ' + JSON.stringify( ignore ) );
          }
          cfg.valuesToIgnore[ key ] = true;
        }
      } // if ( !ignore )...
    }

    return {
      tagsToIgnore: Object.keys( cfg.tagsToIgnore),
      valuesToIgnore: Object.keys( cfg.valuesToIgnore ),
      ignoreDiacritics: cfg.ignoreDiacritics
    };
  }; // defineConfig()

  // ### cloneEntity
  /**
   *
   * Clones the input entity — `e` after excluding it's `text` property.
   *
   * @method NER#cloneEntity
   * @param {object} e — to be cloned.
   * @return {object} the clone.
   * @private
  */
  var cloneEntity = function ( e ) {
    var clone = Object.create( null );

    for ( const key in e ) {
      if ( key !== 'text' ) clone[ key ] = e[ key ];
    }
    return clone;
  }; // cloneEntity()

  // ### copyKVPs
  /**
   *
   * Assign all the key/value pairs of `source` to `target`, excluding **wordCounts**.
   *
   * @method NER#copyKVPs
   * @param {object} target — to which key/value pairs from source are copied.
   * @param {object} source — of key/value pairs.
   * @return {object} the updated `target`.
   * @private
  */
  var copyKVPs = function ( target, source ) {
    //
    for ( var key in source ) {
      if ( key !== 'wordCounts' ) target[ key ] = source[ key ];
    }
    return target;
  }; // copyKVPs()

  // ### normalize
  /**
   *
   * Normalizes the input according to the diacritic configuration.
   *
   * @method NER#normalize
   * @param {string} value — to be normalized.
   * @return {string} normalized `value.`
   * @private
  */
  var normalize = function ( value ) {
    return (
      ( cfg.ignoreDiacritics ) ?
        helpers.string.normalize( value ) :
        value.toLowerCase()
      );
  }; // normalize()

  // ### addUniWordEntity
  /**
   *
   * Process uni-word entity and adds it to `uniWordEntities`.
   *
   * @method NER#addUniWordEntity
   * @param {string[]} words — from entity's text.
   * @param {object} entity — to be added.
   * @return {undefined} nothing!
   * @private
  */
  var addUniWordEntity = function ( words, entity ) {
    const firstWord = words[ 0 ];
    let wordCounts;
    // Latest value overrides previous value, if any.
    if ( uniWordEntities[ firstWord ] ) wordCounts = uniWordEntities[ firstWord ].wordCounts;
    uniWordEntities[ firstWord ] = cloneEntity( entity );
    if ( wordCounts ) uniWordEntities[ firstWord ].wordCounts = wordCounts;
  }; // addUniWordEntity()

  // ### addUniWordEntity
  /**
   *
   * Process multi-word entity and adds it to `multiWordEntities`.
   *
   * @method NER#addMultiWordEntity
   * @param {string} text — property of entity.
   * @param {string[]} words — from entity's text.
   * @param {object} entity — to be added.
   * @return {undefined} nothing!
   * @private
  */
  var addMultiWordEntity = function ( text, words, entity ) {
    const firstWord = words[ 0 ];
    uniWordEntities[ firstWord ] = uniWordEntities[ firstWord ] || Object.create( null );
    uniWordEntities[ firstWord ].wordCounts = uniWordEntities[ firstWord ].wordCounts || [];
    if ( uniWordEntities[ firstWord ].wordCounts.indexOf( words.length ) === -1 ) uniWordEntities[ firstWord ].wordCounts.push( words.length );
    multiWordEntities[ words.join( ' ' ) ] = cloneEntity( entity );
    // The expression is a simple arithmatic formulation to detect acronyms.
    if ( words.length === ( ( text.length + 1 ) / 2 ) ) addUniWordEntity( [ words.join( '' ) ], entity );
  }; // addMultiWordEntity()

  // ### learn
  /**
   *
   * Learns the entities that must be detected via `recognize()/predict()` API
   * calls in a sentence that has been already tokenized either using
   * [wink-tokenizer](https://www.npmjs.com/package/wink-tokenizer) or follows
   * it's token format.
   *
   * It can be used to learn or update learnings incrementally; but it can not be
   * used to unlearn or delete one or more entities.
   *
   * If duplicate entity definitions are enountered then all the entries except
   * the **last one** are ignored.
   *
   * Acronyms must be added with space between each character; for example USA
   * should be added as `'u s a'` — this ensure correct detection of
   * `U S A` or `U. S. A.` or `U.S.A.` as `USA` \[Refer to the example below\].
   *
   * @method NER#learn
   * @param {object[]} entities — where each element defines an entity via
   * two mandatory properties viz. `text` and `entityType` as described later.
   * Note if an element is *not an object* or *does not contain the mandatory
   * properties,* it is ignored.
   *
   * In addition to these two properties, you may optionally define two more
   * properties viz. `uid` and `value`, as described in the table below.
   *
   * <b>Note:</b> Apart from the above mentioned properties, you may also define additional properties .
   * Such properties, along with their values, will be copied to the output token as-is for consumption
   * by any down stream code in the NLP pipe. An example use-case is pos tagging.
   * You can define **pos** property in an entity defition as
   * `{ text: 'manchester united', entityType: 'club', pos: 'NNP' }`.
   * The [wink-pos-tagger](https://www.npmjs.com/package/wink-pos-tagger) will
   * automatically use the `pos` property (if available) to ensure correct
   * tagging in your context by overriding its algorithm.
   *
   * @param {string} entities[].text that must be detected as entity and may
   * consist of more than one word; for example, **`India`** or **`United Kindom.`**
   * @param {string} entities[].entityType type of the entity; for example
   * **`country`**
   * @param {string} [entities[].uid=undefined] unique id for the entity; example
   * usecase of `uid` is using it to access more properties of the entity from a
   * database. If it is `undefined` then it is automatically generated by joining
   * the key words of the detected entity by underscore (_). For example, `'india'`
   * or `'united_kingdom'.`
   * @param {string} [entities[].value=undefined] that is assigned to the value
   * property of the token; if `undefined` then it is equal to the **value**
   * of the token in case of uni-word entities; for multi-word entities, it is
   * generated automatically by joining the key words of the entries by space
   * character. For example, `'india'` or `'united kingdom'.`
   * @return {number} of actual entities learned.
   * @example
   * var trainingData = [
   *   { text: 'manchester united', entityType: 'club', uid: 'manu' },
   *   { text: 'manchester', entityType: 'city' },
   *   { text: 'U K', entityType: 'country', uid: 'uk' }
   * ];
   * myNER.learn( trainingData );
   * // -> 3
  */
  var learn = function ( entities ) {
    // Refer to comments for variables `uniWordEntities` & `multiWordEntities`
    // declarations in the beginning.
    let length = 0;
    for ( let i = 0, imax = entities.length; i < imax; i += 1 ) {
      const entity = entities[ i ];
      // Normalize after removing extra white spaces; required for acronyms processing.
      const text = normalize( ( entity.text || '' ).trim().replace( /\s+/, ' ' ) );
      // Add if `text` and `entityType` are defined.
      if ( text && entity.entityType ) {
        const words = text.split( /\s+/ );
        length += 1;
        if ( words.length === 1 ) {
          addUniWordEntity( words, entity );
        } else {
          addMultiWordEntity( text, words, entity );
        }
      }
    }

    // Ensure longest sequence is highlighted first.
    for ( var key in uniWordEntities ) {
      if ( uniWordEntities[ key ].wordCounts ) uniWordEntities[ key ].wordCounts.sort( helpers.array.descending );
    }

    return length;
  }; // learn()

  // ### isIgnorable
  /**
   *
   * Tests if the input `value` and `tag` can be ignored.
   *
   * @method NER#isIgnorable
   * @param {string} value — to be tested.
   * @param {string} tag — to be tested.
   * @return {boolean} returns `true` if it can be ignored otherwise returns `false.`
   * @private
  */
  var isIgnorable = function ( value, tag ) {
    return (
      ( cfg.tagsToIgnore && cfg.tagsToIgnore[ tag ] ) ||
      ( cfg.valuesToIgnore && cfg.valuesToIgnore[ value ] )
    );
  }; // isIgnorable()

  // ### getNextNTokens
  // Tries next `n` `tokens` for a possible entity.
  var getNextNTokens = function ( i, n, tokens ) {
    // Words that are joined to form candidate entity.
    var words = [];
    // Original sequence is captured here.
    var originalSeq = [];
    // Candidate entity
    var entity;
    // The merged token for multi-word entities.
    var mergedToken;
    // Helper variables.
    var tag, value;
    var k, kmax;

    for ( k = i, kmax = tokens.length; k < kmax && words.length < n; k += 1 ) {
      value = tokens[ k ].value;
      tag = tokens[ k ].tag;
      // If ignorable then simply follow the next iteration, after saving the
      // current value into the original sequence of tokens; otherwise
      // save it in words else just reset & break!
      if ( isIgnorable( value, tag ) ) {
        originalSeq.push( value );
      } else {
         // Ensure `words` receive normalized value.
         words.push( normalize( value ) );
         // Here `value` must go **as is**.
         originalSeq.push( value );
      }
    } // for ( k = i... )

    entity = multiWordEntities[ words.join( ' ' ) ];
    if ( !entity ) {
      words.push( singularize( words.pop() ) );
      entity = multiWordEntities[ words.join( ' ' ) ];
    }

    if ( entity ) {
      // Copy the entity into the merged token.
      mergedToken = copyKVPs( Object.create( null ), entity );
      // Save original sequence of tokens that were detected as an entity.
      mergedToken.originalSeq = originalSeq;
      // If id is missing, create id by joining `words`.
      mergedToken.uid = entity.uid || words.join( '_' );
      // If value was not defined, default to words.
      mergedToken.value = mergedToken.value || words.join( ' ' );
      // move the next token's index — `nti` to `k`.
      return { token: mergedToken, nti: k };
    }

    // No success, do not move the next token's index — `nti`.
    return { nti: i };
  }; // getNextNTokens()

  // ### lookup
  /**
   * Exports the JSON of the learnings generated by `learn()`, which may be
   * saved in a file that may be used later for NER purpose.
   *
   * @method NER#lookup
   * @private
   * @param {number} i — index of tokens, from where the lookup is performed.
   * @param {object[]} tokens — input tokens to NER.
   * @param {object} candidate — result of lookup in `uniWordEntities`.
   * @param {array} nerdts — NERed tokens.
   * @return {number} of the learnings.
   * @example
   * var learnings = myNER.exportJSON();
  */
  var lookup = function ( i, tokens, candidate, nerdts ) {
    var result;
    for ( var k = 0, kmax = candidate.wordCounts.length; k < kmax; k += 1 ) {
      result = getNextNTokens( i, candidate.wordCounts[ k ], tokens );
      if ( result.token ) {
        result.token.tag = 'word';
        nerdts.push( result.token );
        break;
      }
    }
    return result.nti;
  };

  // ### recognize
  /**
   *
   * Recognizes entities in the input `tokens.` Any token(s), which is recognized
   * as an entity, will automatically receive the properties that have been defined
   * for the *detected entity* using [`learn()`](#learn). If a set of tokens together
   * are recognized as a single entity, then they are merged in to a single
   * token; the merged tokens `value` property becomes the concatenation of all
   * the `values` from merged tokens, separated by space.
   *
   * @method NER#recognize
   * @param {object[]} tokens — tokenized either using
   * [wink-tokenizer](https://www.npmjs.com/package/wink-tokenizer) or follow
   * it's standards.
   *
   * @return {object[]} of updated `tokens` with entities tagged.
   * @example
   * // Use wink tokenizer.
   * var winkTokenizer = require( 'wink-tokenizer' );
   * // Instantiate it and use tokenize() api.
   * var tokenize = winkTokenizer().tokenize;
   * var tokens = tokenize( 'Manchester United is a professional football club based in Manchester, U. K.' )
   * // Detect entities.
   * myNER.recognize( tokens );
   * // -> [
   * //      { entityType: 'club', uid: 'manu', originalSeq: [ 'Manchester', 'United' ], value: 'manchester united', tag: 'word' },
   * //      { value: 'is', tag: 'word' },
   * //      { value: 'a', tag: 'word' },
   * //      { value: 'professional', tag: 'word' },
   * //      { value: 'football', tag: 'word' },
   * //      { value: 'club', tag: 'word' },
   * //      { value: 'based', tag: 'word' },
   * //      { value: 'in', tag: 'word' },
   * //      { value: 'Manchester', tag: 'word', originalSeq: [ 'Manchester' ], uid: 'manchester', entityType: 'city' },
   * //      { value: ',', tag: 'punctuation' },
   * //      { entityType: 'country', uid: 'uk', originalSeq: [ 'U', '.', 'K' ], value: 'u k', tag: 'word' },
   * //      { value: '.', tag: 'punctuation' }
   * //    ]
  */
  var recognize = function ( tokens ) {
    // var tokens = sentence; // tokenize( sentence.toLowerCase() );
    // NERed Tokens.
    var nerdts = [];
    var t;
    var inew;
    var action, candidate;
    for ( var i = 0, imax = tokens.length; i < imax; i += 1 ) {
      t = tokens[ i ];
      if ( !cfg.tagsToIgnore || !cfg.tagsToIgnore[ t.tag ] ) {
        // Look up for the word; if not found try its base form.
        let value = t.value;
        value = normalize( value );
        candidate = uniWordEntities[ value ];
        if ( !candidate ) {
          // This ensures that right `value` is used for `id`.
          value = singularize( value );
          candidate = uniWordEntities[ value ];
        }
        // NE lookup may return `undefined` meaning that the current token is
        // neither an entity or the first word of a multi-word entity (1).
        // Otherwise if `wordCounts` is `undefined` means that it is an uni-word
        // entity (2). Finally with given `wordCounts`, if the `entityType` is
        // `undefined` means that it will be a multi-word entity (3); otherwise
        // it is an uni/multi word entity (4) — try to match the longest one first!
        action = ( candidate === undefined ) ?
                    1 : ( candidate.wordCounts === undefined ) ?
                      2 : ( candidate.entityType === undefined ) ?
                        3 : 4;

        switch ( action ) { // eslint-disable-line default-case
          case 1:
            // Non-entity, just push the token to `nerdts`.
            nerdts.push( t );
            break;
          case 2:
            // The value pointed to an uni-word named entity, push it to `nerdts`
            t.originalSeq = [ t.value ];
            t.uid = value;
            // If value was not defined, default to `value`.
            candidate.value = candidate.value || value;
            nerdts.push( copyKVPs( t, candidate ) );
            break;
          case 3:
            // Lookup multi-word entity(s) as per the `candiadte.wordCounts`.
            inew = lookup( i, tokens, candidate, nerdts );
            if ( i === inew ) nerdts.push( t );
            else i = inew - 1;
            break;
          case 4:
            // Lookup for uni/multi-word entity, starting with longest one first.
            inew = lookup( i, tokens, candidate, nerdts );
            if ( i === inew ) {
              t.originalSeq = [ t.value ];
              t.uid = value;
              nerdts.push( copyKVPs( t, candidate ) );
            } else i = inew - 1;
            break;
        }
      } else {
        nerdts.push( t );
      }
    }
    return ( nerdts );
  }; // recognize()

  // ### initialize
  /**
   * Initalizes the config and learning related variables.
   *
   * @method NER#initialize
   * @private
   * @return {undefined} of the learnings.
  */
  var initialize = function ( ) {
    // Define default configuration.
    // Ignore `punctuation`;
    cfg.tagsToIgnore = Object.create( null );
    cfg.tagsToIgnore.punctuation = true;
    // Leave values to ignore `undefined`;
    cfg.valuesToIgnore = Object.create( null );
    // And ignore diacritics by default.
    cfg.ignoreDiacritics = true;
    // Initialize learnings
    uniWordEntities = Object.create( null );
    multiWordEntities = Object.create( null );
  }; // initialize()

  // ### reset
  /**
   *
   * Resets the named entity recognizer by re-initializing all the learnings and
   * by setting the configuration to default.
   *
   * @method NER#reset
   * @return {boolean} always true.
   * @example
   * myNER.reset( );
   * // -> true
  */
  var reset = function ( ) {
    initialize();
    return true;
  }; // reset()

  // ### exportJSON
  /**
   *
   * Exports the JSON of the learnings generated by `learn()`, which may be
   * saved in a file that may be used later for NER purpose.
   *
   * @method NER#exportJSON
   * @return {json} of the learnings.
   * @example
   * var learnings = myNER.exportJSON();
  */
  var exportJSON = function ( ) {
    return ( JSON.stringify( [
      cfg,
      uniWordEntities,
      multiWordEntities,
      // For future expansion but the import will have to have intelligence to
      // set the default values and still ensure nothing breaks! Hopefully!!
      {},
      [],
      []
    ] ) );
  }; // exportJSON()

  // ### importJSON
  /**
   *
   * Imports the ner learnings from an already exported ner learnings via the
   * [`exportJSON()`](#exportjson).
   *
   * @method NER#importJSON
   * @param {json} json — containg an earlier exported learnings in JSON format.
   * @return {boolean} always `true`.
   * @throws {error} if invalid JSON is encountered.
   * @example
   * var myNER = ner();
   * // Assuming that `json` has valid learnings.
   * myNER.importJSON( json );
  */
  var importJSON = function ( json ) {
    if ( !json ) {
      throw Error( 'wink-ner: undefined or null JSON encountered, import failed!' );
    }
    // Validate json format
    var isOK = [
      helpers.object.isObject,
      helpers.object.isObject,
      helpers.object.isObject,
      helpers.object.isObject,
      helpers.array.isArray,
      helpers.array.isArray
    ];
    var parsedJSON;
    try {
      parsedJSON = JSON.parse( json );
    } catch ( ex ) {
      throw Error( 'wink-ner: invalid JSON structure encountered, can not import.' );
    }

    if ( !helpers.array.isArray( parsedJSON ) || parsedJSON.length !== isOK.length ) {
      throw Error( 'wink-ner: invalid JSON format encountered, can not import.' );
    }

    for ( var i = 0; i < isOK.length; i += 1 ) {
      if ( !isOK[ i ]( parsedJSON[ i ] ) ) {
        throw Error( 'wink-ner: invalid JSON element encountered, can not import.' );
      }
    }
    // All good, setup variable values.
    // First reset everything.
    reset();
    // Load variable values.
    cfg = parsedJSON[ 0 ];
    uniWordEntities = parsedJSON[ 1 ];
    multiWordEntities = parsedJSON[ 2 ];
    // Return success.
    return true;
  }; // importJSON()

  // Main Code starts here!
  initialize();

  methods.defineConfig = defineConfig;
  methods.learn = learn;
  methods.predict = recognize;
  methods.recognize = recognize;
  methods.exportJSON = exportJSON;
  methods.importJSON = importJSON;
  methods.reset = reset;

  return methods;
};

module.exports = ner;
var x = ner();
var t = require( 'wink-tokenizer' )().tokenize;
x.learn(
  [
    { text: 'f - 16', entityType: 'plane' }
  ]
);

x.recognize( t( '-p' ) );

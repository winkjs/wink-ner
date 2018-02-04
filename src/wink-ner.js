//     wink-ner
//     Language agnostic named entity recognizer
//
//     Copyright (C) 2017-18  GRAYPE Systems Private Limited
//
//     This file is part of “wink-ner”.
//
//     “wink-ner” is free software: you can redistribute it
//     and/or modify it under the terms of the GNU Affero
//     General Public License as published by the Free
//     Software Foundation, version 3 of the License.
//
//     “wink-ner” is distributed in the hope that it will
//     be useful, but WITHOUT ANY WARRANTY; without even
//     the implied warranty of MERCHANTABILITY or FITNESS
//     FOR A PARTICULAR PURPOSE.  See the GNU Affero General
//     Public License for more details.
//
//     You should have received a copy of the GNU Affero
//     General Public License along with “wink-ner”.
//     If not, see <http://www.gnu.org/licenses/>.

//
var singularize = require( 'wink-lemmatizer' ).lemmatizeNoun;
var helpers = require( 'wink-helpers' );

var ner = function () {
  // Returned!
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
   * Configures the property/value pairs of tokens that should be ignored if
   * they are found between tokens during entity detection. For example, ignoring
   * `'punctuation'` value for `'tag'` property will ensures '-' or '.' etc
   * are ignored and correctly detect kg and k.g. as kg (kilogram symbol) or
   * Guinea-Bissau and Guinea Bissau as Guinea-Bissau (a country in West Africa).
   *
   * @param {object} config — defines the `values` and/or `tags` of the tokens
   * to ignore during entity detection. Note if any one of them matches, the token
   * will be ignored.
   *
   * *An empty config object is equivalent to setting all properties to `undefined.`*
   *
   * The table below details the 2 properties:
   * @param {string[]} [config.valuesToIgnore=undefined] contains comma separated
   * `value` of tokens that should be ignored during entity detection.
   * @param {string[]} [config.tagsToIgnore=[ 'punctuation' ]] contains comma separated
   * [`tag`](http://winkjs.org/wink-tokenizer/#defineconfig) of tokens that should
   * be ignored during entity detection. Note: *`number` and `word` tags can never
   * be ignored.
   * @return {bolean} always `true`.
   * @throws {error} if `valuesToIgnore` is not an array of strings.
   * @throws {error} if `tagsToIgnore` is not an array of strings.
   * @throws {error} if `tagsToIgnore` contains an invalid tag.
   * @example
  */
  var defineConfig = function ( config ) {
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

    cfg = config;

    return cfg;
  }; // defineConfig()

  // ### cloneEntity
  /**
   *
   * Clones the input entity — `e` after excluding it's `text` property.
   *
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

  // ### learn
  /**
   *
   * Learns the entities that must be detected via `recognize()/predict()` API
   * calls in a sentence that has been already tokenized either using
   * [wink-tokenizer](https://www.npmjs.com/package/wink-tokenizer) or follows
   * it's token format.
   *
   * It can be use to learn or update learnings incrementally; but it can not be
   * used to unlearn or delete one or more entities.
   *
   * If duplicated entity definitions are enountered then all the entries except
   * the **last one** are ignored.
   *
   * @param {object[]} entities — where each element defines an entity via
   * two mandatory properties viz. `text` and `entityType` as described later.
   * Note if an element is *not an object* or *does not contain the mandatory
   * properties,* it is ignored.
   *
   * In addition to these two properties, you may optionally defined two more
   * properties as described in the table below. Apart from these **4 properties**,
   * if any additional property is defined, the same is copied to the output
   * entity token as-is for consumption by your code to simplify processing.
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
  */
  var learn = function ( entities ) {
    // Refer to comments for variables `uniWordEntities` & `multiWordEntities`
    // declarations in the beginning.
    for ( let i = 0, imax = entities.length; i < imax; i += 1 ) {
      const entity = entities[ i ];
      const text = entity.text;
      const entityType = entity.text;
      let wordCounts;
      if ( text && entityType ) {
        const words = normalize( text.trim() ).split( /\s+/ );
        const firstWord = words[ 0 ];
        if ( words.length === 1 ) {
          // Process uni-word entity.
          // Latest value overrides previous value, if any.
          if ( uniWordEntities[ firstWord ] ) wordCounts = uniWordEntities[ firstWord ].wordCounts;
          uniWordEntities[ firstWord ] = cloneEntity( entity );
          if ( wordCounts ) uniWordEntities[ firstWord ].wordCounts = wordCounts;
        } else {
          // Process multi-word entity.
          uniWordEntities[ firstWord ] = uniWordEntities[ firstWord ] || Object.create( null );
          uniWordEntities[ firstWord ].wordCounts = uniWordEntities[ firstWord ].wordCounts || [];
          if ( uniWordEntities[ firstWord ].wordCounts.indexOf( words.length ) === -1 ) uniWordEntities[ firstWord ].wordCounts.push( words.length );
          multiWordEntities[ words.join( ' ' ) ] = cloneEntity( entity );
        }
      }
    }

    // Ensure longest sequence is highlighted first.
    for ( var key in uniWordEntities ) {
      if ( uniWordEntities[ key ].wordCounts ) uniWordEntities[ key ].wordCounts.sort( helpers.array.descending );
    }

    return entities.length;
  }; // learn()

  // ### isIgnorable
  /**
   *
   * Tests if the input `value` and `tag` can be ignored.
   *
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
      // current value into the original sequence of tokens; otherwise if
      // token is a word or number save it in words else just reset & break!
      if ( isIgnorable( value, tag ) ) {
        originalSeq.push( value );
      } else if ( tag === 'word' || tag === 'number' ) {
               // `word` and `number` tags form entities, include them in `words`,
               // while ensuring `words` receive normalized value.
               words.push( normalize( value ) );
               // Here `value` must go **as is**.
               originalSeq.push( value );
             } else {
               // Can not be ignored: reset & break!
               words = [];
               originalSeq = [];
               break;
             }
    } // for ( k = i... )

    if ( words.length > 0 ) {
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
    }

    // No success, do not move the next token's index — `nti`.
    return { nti: i };
  }; // getNextNTokens()

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
   * @param {object[]} tokens — tokenized either using
   * [wink-tokenizer](https://www.npmjs.com/package/wink-tokenizer) or follow
   * it's standards.
   *
   * @return {object[]} of updated `tokens.`
   * @example
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
      if ( t.tag === 'word' ) {
        // Look up for the word; if not found try its base form.
        let value = t.value || '';
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

        switch ( action ) {
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
          default:
            throw Error( 'Unknown exception!' );
        }
      } else {
        nerdts.push( t );
      }
    }
    return ( nerdts );
  }; // recognize()

  var exportJSON = function ( ) {
    return true;
  }; // exportJSON()

  var importJSON = function ( ) {
    return true;
  }; // importJSON()

  var reset = function ( ) {
    return true;
  }; // reset()

  // Define default configuration.
  // Ignore `punctuation`;
  cfg.tagsToIgnore = Object.create( null );
  cfg.tagsToIgnore.punctuation = true;
  // Leave values to ignore `undefined`;
  cfg.valuesToIgnore = Object.create( null );
  // And ignore diacritics by default.
  cfg.ignoreDiacritics = true;

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

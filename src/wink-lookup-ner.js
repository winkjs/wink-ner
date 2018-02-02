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

var ner = function () {
  // Returned!
  var methods = Object.create( null );
  // Configuration - what tags or values to ignore during recognition phase.
  var cfg = Object.create( null );

  var defineConfig = function ( config ) {
    cfg = config;

    return cfg;
  }; // defineConfig()

  var learn = function ( ) {
    return true;
  }; // learn()

  var recognize = function ( ) {
    return true;
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

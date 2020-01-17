# wink-ner

Language agnostic named entity recognizer

### [![Build Status](https://api.travis-ci.org/winkjs/wink-ner.svg?branch=master)](https://travis-ci.org/winkjs/wink-ner) [![Coverage Status](https://coveralls.io/repos/github/winkjs/wink-ner/badge.svg?branch=master)](https://coveralls.io/github/winkjs/wink-ner?branch=master) [![Inline docs](http://inch-ci.org/github/winkjs/wink-ner.svg?branch=master)](http://inch-ci.org/github/winkjs/wink-ner) [![dependencies Status](https://david-dm.org/winkjs/wink-ner/status.svg)](https://david-dm.org/winkjs/wink-ner) [![devDependencies Status](https://david-dm.org/winkjs/wink-ner/dev-status.svg)](https://david-dm.org/winkjs/wink-ner?type=dev) [![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/winkjs/Lobby)

[<img align="right" src="https://decisively.github.io/wink-logos/logo-title.png" width="100px" >](http://winkjs.org/)

Recognize named entities in a sentence using **`wink-ner`**. It is a smart Gazetteer-based Named Entity Recognizer (NER), which can be easily trained to suite specific needs. For example, the wink-ner can differentiate between `Manchester United` & `Manchester` in a single sentence and tag them as a club and city respectively.

### Installation

Use [npm](https://www.npmjs.com/package/wink-ner) to install:

    npm install wink-ner --save

### Getting Started
#### Named Entity Recognition
```javascript
// Load wink ner.
var ner = require( 'wink-ner' );
// Create your instance of wink ner & use default config.
var myNER = ner();
// Define training data.
var trainingData = [
  { text: 'manchester united', entityType: 'club', uid: 'manu' },
  { text: 'manchester', entityType: 'city' },
  { text: 'U K', entityType: 'country', uid: 'uk' }
];
// Learn from the training data.
myNER.learn( trainingData );
// Since recognize() requires tokens, use wink-tokenizer.
var winkTokenizer = require( 'wink-tokenizer' );
// Instantiate it and extract tokenize() api.
var tokenize = winkTokenizer().tokenize;
// Tokenize the sentence.
var tokens = tokenize( 'Manchester United is a football club based in Manchester, U. K.' );
// Simply Detect entities!
tokens = myNER.recognize( tokens );
console.log( tokens );
// -> [
//      { entityType: 'club', uid: 'manu', originalSeq: [ 'Manchester', 'United' ],
//        value: 'manchester united', tag: 'word' },
//      { value: 'is', tag: 'word' },
//      { value: 'a', tag: 'word' },
//      { value: 'football', tag: 'word' },
//      { value: 'club', tag: 'word' },
//      { value: 'based', tag: 'word' },
//      { value: 'in', tag: 'word' },
//      { entityType: 'city', value: 'Manchester', tag: 'word',
//        originalSeq: [ 'Manchester' ], uid: 'manchester' },
//      { value: ',', tag: 'punctuation' },
//      { entityType: 'country', uid: 'uk', originalSeq: [ 'U', '.', 'K' ],
//        value: 'u k', tag: 'word' },
//      { value: '.', tag: 'punctuation' }
//    ]
```
#### Integration with POS Tagging
The `tokens` returned from `recognize()` may be further passed down to `tag()` api of [**`wink-pos-tagger`**](https://www.npmjs.com/package/wink-pos-tagger) for pos tagging.

Just in case you need to assign a specific pos tag to an entity, the same can be achieved by including a property `pos` in the entity definition and assigning it the desired pos tag (e.g. `'NNP'`); the wink-pos-tagger will automatically do the needful. For details please refer to [`learn()`](#learn) api of wink-ner.

```javascript
// Load pos tagger.
var tagger = require( 'wink-pos-tagger' );
// Instantiate it and extract tag api.
var tag = tagger().tag;
tokens = tag( tokens );
console.log( tokens );
// -> [ { entityType: 'club', uid: 'manu', originalSeq: [ 'Manchester', 'United' ],
//        value: 'manchester united', tag: 'word', normal: 'manchester united', pos: 'NNP' },
//      { value: 'is', tag: 'word', normal: 'is', pos: 'VBZ', lemma: 'be' },
//      { value: 'a', tag: 'word', normal: 'a', pos: 'DT' },
//      { value: 'football', tag: 'word', normal: 'football', pos: 'NN', lemma: 'football' },
//      { value: 'club', tag: 'word', normal: 'club', pos: 'NN', lemma: 'club' },
//      { value: 'based', tag: 'word', normal: 'based', pos: 'VBN', lemma: 'base' },
//      { value: 'in', tag: 'word', normal: 'in', pos: 'IN' },
//      { value: 'Manchester', tag: 'word', originalSeq: [ 'Manchester' ],
//        uid: 'manchester', entityType: 'city', normal: 'manchester', pos: 'NNP' },
//      { value: ',', tag: 'punctuation', normal: ',', pos: ',' },
//      { entityType: 'country', uid: 'uk', originalSeq: [ 'U', '.', 'K' ],
//        value: 'u k', tag: 'word', normal: 'u k', pos: 'NNP' },
//      { value: '.', tag: 'punctuation', normal: '.', pos: '.' }
//    ]

```
### Documentation
Check out the [named entity recognizer API documentation](http://winkjs.org/wink-ner/) to learn more.

### Need Help?

If you spot a bug and the same has not yet been reported, raise a new [issue](https://github.com/winkjs/wink-ner/issues) or consider fixing it and sending a pull request.

### About wink
[Wink](http://winkjs.org/) is a family of open source packages for **Statistical Analysis**, **Natural Language Processing** and **Machine Learning** in NodeJS. The code is **thoroughly documented** for easy human comprehension and has a **test coverage of ~100%** for reliability to build production grade solutions.

### Copyright & License

**wink-ner** is copyright 2017-20 [GRAYPE Systems Private Limited](http://graype.in/).

It is licensed under the terms of the MIT License.

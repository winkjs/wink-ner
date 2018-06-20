# wink-ner

Language agnostic named entity recognizer

### [![Build Status](https://api.travis-ci.org/winkjs/wink-ner.svg?branch=master)](https://travis-ci.org/winkjs/wink-ner) [![Coverage Status](https://coveralls.io/repos/github/winkjs/wink-ner/badge.svg?branch=master)](https://coveralls.io/github/winkjs/wink-ner?branch=master) [![Inline docs](http://inch-ci.org/github/winkjs/wink-ner.svg?branch=master)](http://inch-ci.org/github/winkjs/wink-ner) [![dependencies Status](https://david-dm.org/winkjs/wink-ner/status.svg)](https://david-dm.org/winkjs/wink-ner) [![devDependencies Status](https://david-dm.org/winkjs/wink-ner/dev-status.svg)](https://david-dm.org/winkjs/wink-ner?type=dev)

[<img align="right" src="https://decisively.github.io/wink-logos/logo-title.png" width="100px" >](http://winkjs.org/)

Recognize named entities in a sentence using **`wink-ner`**. It is a part of [wink](http://winkjs.org/) — a growing family of high quality packages for Statistical Analysis, Natural Language Processing and Machine Learning in NodeJS.

### Installation

Use [npm](https://www.npmjs.com/package/wink-ner) to install:

    npm install wink-ner --save

### Getting Started

```javascript
// Load wink ner.
var ner = require( 'wink-ner' );
// Create your instance of wink ner & use defualt config.
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
var tokens = tokenize( 'Manchester United is a football club based in Manchester, U. K.' )
// Simply Detect entities!
myNER.recognize( tokens );
// -> [
//      { entityType: 'club', uid: 'manu', originalSeq: [ 'Manchester', 'United' ], value: 'manchester united', tag: 'word' },
//      { value: 'is', tag: 'word' },
//      { value: 'a', tag: 'word' },
//      { value: 'football', tag: 'word' },
//      { value: 'club', tag: 'word' },
//      { value: 'based', tag: 'word' },
//      { value: 'in', tag: 'word' },
//      { entityType: 'city', value: 'Manchester', tag: 'word', originalSeq: [ 'Manchester' ], uid: 'manchester' },
//      { value: ',', tag: 'punctuation' },
//      { entityType: 'country', uid: 'uk', originalSeq: [ 'U', '.', 'K' ], value: 'u k', tag: 'word' },
//      { value: '.', tag: 'punctuation' }
//    ]
```

### Documentation
Check out the [named entity recognizer API documentation](http://winkjs.org/wink-ner/) to learn more.

### Need Help?

If you spot a bug and the same has not yet been reported, raise a new [issue](https://github.com/winkjs/wink-ner/issues) or consider fixing it and sending a pull request.

### Copyright & License

**wink-ner** is copyright 2017-18 [GRAYPE Systems Private Limited](http://graype.in/).

It is licensed under the under the terms of the GNU Affero General Public License as published by the Free
Software Foundation, version 3 of the License.

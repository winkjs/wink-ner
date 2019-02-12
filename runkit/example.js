/* eslint-disable no-console */
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
var tokens = tokenize( 'Manchester United is a football club based in Manchester, U. K.' );
// Simply Detect entities!
tokens = myNER.recognize( tokens );
console.log( tokens );

const embeddedBrain = require('./embedded-brain');

function promptFor(input) { return input.message; }
function answer(input) { return Promise.resolve(embeddedBrain.answer(input)); }
function localModelAvailable() { return true; }
module.exports = { answer, localModelAvailable, promptFor, brainType: 'embedded-knowledge-and-context' };

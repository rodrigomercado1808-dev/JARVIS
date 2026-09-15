const { weights } = require('../src/neural-engine');
console.log(JSON.stringify({ format: weights.format, version: weights.version, vocabularySize: weights.vocabulary.length, domains: weights.domains, weightRows: weights.domainWeights.length, intentRows: Object.keys(weights.intentWeights).length }, null, 2));

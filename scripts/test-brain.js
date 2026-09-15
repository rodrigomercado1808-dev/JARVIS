const assert = require('node:assert/strict');
const brain = require('../src/embedded-brain');
const first = brain.answer({ message: 'Necesito una función en JavaScript', history: [], memories: [], webResults: [] });
assert.equal(first.domain, 'programming'); assert.match(first.text, /function sumar/); assert.ok(first.usedTools.includes('neural-weights'));
const second = brain.answer({ message: '¿Podés profundizar?', history: [{ role: 'assistant', content: first.text }], memories: [], webResults: [] });
assert.ok(second.text.includes('Contexto') || second.text.includes('Continuando'));
const quantum = brain.answer({ message: '¿Qué es la superposición cuántica?', history: [], memories: [], webResults: [] });
assert.equal(quantum.domain, 'quantum'); assert.match(quantum.text, /superposición|Superposición/);
console.log('brain ok', JSON.stringify({ programming: first.confidence, followUp: second.intent, quantum: quantum.confidence }));

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildApp } = require('../src/app');
const { tools } = require('../src/tools');

test('health check is public and does not expose secrets', async () => { const app = buildApp(); const res = await app.inject({ method: 'GET', url: '/health' }); assert.equal(res.statusCode, 200); const body = res.json(); assert.equal(body.status, 'ok'); assert.equal('apiKey' in body, false); await app.close(); });
test('frontend is served at root', async () => { const app = buildApp(); const res = await app.inject({ method: 'GET', url: '/' }); assert.equal(res.statusCode, 200); assert.match(res.body, /JARVIS/); await app.close(); });
test('chat validates input and works without provider', async () => { const app = buildApp(); const bad = await app.inject({ method: 'POST', url: '/api/chat', payload: {} }); assert.equal(bad.statusCode, 400); const good = await app.inject({ method: 'POST', url: '/api/chat', payload: { message: 'Hola' } }); assert.equal(good.statusCode, 200); assert.equal(good.json().success, true); await app.close(); });
test('calculator rejects unsafe expressions', async () => { assert.equal((await tools.calculator.execute({ expression: '2 + 3 * 4' })).result, 14); assert.throws(() => tools.calculator.execute({ expression: 'process.exit()' })); });
test('memory endpoint stores and searches data', async () => { const app = buildApp(); const saved = await app.inject({ method:'POST', url:'/api/memory', payload:{ content:'Mi proyecto usa JavaScript', type:'project' } }); assert.equal(saved.statusCode, 200); const found = await app.inject({ method:'GET', url:'/api/memory?q=JavaScript' }); assert.equal(found.json().memories.length, 1); await app.close(); });

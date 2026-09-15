const path = require('node:path');
const crypto = require('node:crypto');
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const fastifyStatic = require('@fastify/static');
const { z } = require('zod');
const { config, publicConfig, firebaseWebConfig } = require('./config');
const { isConnected } = require('./firebase');
const { resolveUser } = require('./auth');
const { MemoryManager } = require('./memory');
const { answer, localModelAvailable } = require('./local-brain');
const { needsWebSearch } = require('./neural-engine');
const { searchWeb } = require('./web-search');
const { tools, listTools } = require('./tools');

function buildApp() {
  const app = Fastify({ logger: { redact: ['req.headers.authorization', 'req.headers.cookie'] } });
  const memory = new MemoryManager(); const started = Date.now();
  app.register(cors, { origin: true }); app.register(fastifyStatic, { root: path.join(__dirname, '..', 'public'), prefix: '/' });
  app.get('/', async (_, reply) => reply.sendFile('index.html'));
  app.get('/api/config/firebase', async () => ({ configured: Boolean(firebaseWebConfig().apiKey && firebaseWebConfig().authDomain && firebaseWebConfig().appId), config: firebaseWebConfig() }));
  app.get('/health', async () => ({ status: 'ok', version: require('../package.json').version, firebase: isConnected(), embeddedBrain: localModelAvailable(), weights: 'brain/weights.json', mode: 'javascript-neural-brain-with-context', uptimeSeconds: Math.round((Date.now() - started) / 1000) }));
  app.get('/api/status', async request => { const user = await resolveUser(request); return { ...publicConfig(), authenticated: Boolean(user?.authenticated), userId: user?.authenticated ? user.uid : null, storageMode: user?.authenticated && isConnected() ? 'firebase' : 'sessionStorage' }; });
  app.get('/api/tools', async () => ({ tools: listTools() }));
  app.post('/api/chat', async (request, reply) => {
    const parsed = z.object({ message: z.string().min(1).max(10000), history: z.array(z.object({ role: z.string(), content: z.string() })).max(30).default([]) }).safeParse(request.body); if (!parsed.success) return reply.code(400).send({ success: false, error: parsed.error.flatten() });
    const user = await resolveUser(request); if (!user) return reply.code(401).send({ success: false, error: 'authentication_required' }); const { message, history } = parsed.data; const context = await memory.getContext(user.uid, message); let webResults = []; let usedTools = [];
    const firstPass = await answer({ message, history, memories: context.memories, webResults: [] });
    if (needsWebSearch(message, { label: firstPass.domain, probabilities: { [firstPass.domain]: firstPass.confidence } }, { label: firstPass.intent })) { try { const web = await searchWeb(message); webResults = web.results; if (webResults.length && user.authenticated && isConnected()) { usedTools.push('web-learning'); await memory.saveMemory({ userId: user.uid, content: JSON.stringify({ query: message, learned: webResults.map(r => ({ title: r.title, snippet: r.snippet, url: r.url })) }), type: 'learned_research', importance: 0.7, metadata: { query: message, learnedAt: new Date().toISOString() } }); } } catch { usedTools.push('web-unavailable'); } }
    const result = await answer({ message, history, memories: context.memories, webResults }); usedTools.push(...result.usedTools); return { success: true, response: result.text, conversation_id: `conversation:${user.uid}`, message_id: crypto.randomUUID(), used_tools: [...new Set(usedTools)], storage: user.authenticated && isConnected() ? 'firebase' : 'sessionStorage', authenticated: user.authenticated, learned: webResults.length > 0, domain: result.domain, intent: result.intent, confidence: result.confidence };
  });
  app.get('/api/memory', async (request, reply) => { const user = await resolveUser(request, request.query?.user_id); if (!user) return reply.code(401).send({ success: false, error: 'authentication_required' }); return { memories: user.authenticated && isConnected() ? await memory.searchMemory(user.uid, request.query?.q || '') : [] }; });
  app.post('/api/memory', async (request, reply) => { const user = await resolveUser(request, request.body?.user_id); if (!user) return reply.code(401).send({ success: false, error: 'authentication_required' }); const parsed = z.object({ content: z.string().min(1), type: z.string().default('general'), importance: z.number().min(0).max(1).default(0.5) }).safeParse(request.body); if (!parsed.success) return reply.code(400).send({ success: false, error: parsed.error.flatten() }); return { success: true, memory: await memory.saveMemory({ userId: user.uid, ...parsed.data }) }; });
  app.delete('/api/memory/:memory_id', async (request, reply) => { const user = await resolveUser(request); if (!user) return reply.code(401).send({ success: false, error: 'authentication_required' }); await memory.deleteMemory(user.uid, request.params.memory_id); return { success: true }; });
  app.get('/api/history', async () => ({ messages: [] })); app.post('/api/tasks', async request => ({ success: true, task: { ...request.body, id: crypto.randomUUID(), status: 'pending' } })); app.get('/api/tasks', async () => ({ tasks: [] }));
  app.post('/api/tools/:tool_name', async (request, reply) => { const tool = tools[request.params.tool_name]; if (!tool) return reply.code(404).send({ success: false, error: 'tool_not_found' }); try { return { success: true, result: await tool.execute(request.body || {}) }; } catch (error) { return reply.code(400).send({ success: false, error: error.message }); } });
  app.post('/api/voice/transcribe', async () => ({ available: false, reason: 'voice_not_configured' })); app.post('/api/voice/speak', async () => ({ available: false, reason: 'voice_not_configured' })); app.post('/api/vision/analyze', async () => ({ available: false, reason: 'vision_not_configured' })); return app;
}
module.exports = { buildApp };

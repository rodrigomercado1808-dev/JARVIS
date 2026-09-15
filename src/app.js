const path = require('node:path');
const crypto = require('node:crypto');
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const fastifyStatic = require('@fastify/static');
const { z } = require('zod');
const { config, publicConfig } = require('./config');
const { isConnected } = require('./firebase');
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
  app.get('/health', async () => ({ status: 'ok', version: require('../package.json').version, firebase: isConnected(), embeddedBrain: localModelAvailable(), weights: 'brain/weights.json', mode: 'javascript-neural-brain-with-context', uptimeSeconds: Math.round((Date.now() - started) / 1000) }));
  app.get('/api/status', async () => ({ ...publicConfig(), storageMode: isConnected() ? 'firebase' : 'sessionStorage' }));
  app.get('/api/tools', async () => ({ tools: listTools() }));
  app.post('/api/chat', async (request, reply) => {
    const parsed = z.object({ user_id: z.string().min(1).default(config.defaultUserId), message: z.string().min(1).max(10000), history: z.array(z.object({ role: z.string(), content: z.string() })).max(20).default([]) }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ success: false, error: parsed.error.flatten() });
    const { user_id, message, history } = parsed.data; const context = await memory.getContext(user_id, message); let webResults = []; let usedTools = [];
    const firstPass = await answer({ message, history, memories: context.memories, webResults: [] });
    if (needsWebSearch(message, { label: firstPass.domain, probabilities: { [firstPass.domain]: firstPass.confidence } }, { label: firstPass.intent })) {
      try { const web = await searchWeb(message); webResults = web.results; if (webResults.length) { usedTools.push('web-learning'); await memory.saveMemory({ userId: user_id, content: JSON.stringify({ query: message, learned: webResults.map(r => ({ title: r.title, snippet: r.snippet, url: r.url })) }), type: 'learned_research', importance: 0.7, metadata: { query: message, learnedAt: new Date().toISOString() } }); } } catch { usedTools.push('web-unavailable'); }
    }
    const result = await answer({ message, history, memories: context.memories, webResults }); usedTools.push(...result.usedTools);
    return { success: true, response: result.text, conversation_id: `conversation:${user_id}`, message_id: crypto.randomUUID(), used_tools: [...new Set(usedTools)], storage: isConnected() ? 'firebase' : 'sessionStorage', local_model: true, learned: webResults.length > 0, domain: result.domain, intent: result.intent, confidence: result.confidence };
  });
  app.post('/api/memory', async (request, reply) => { const parsed = z.object({ user_id: z.string().default(config.defaultUserId), content: z.string().min(1), type: z.string().default('general'), importance: z.number().min(0).max(1).default(0.5) }).safeParse(request.body); if (!parsed.success) return reply.code(400).send({ success: false, error: parsed.error.flatten() }); const { user_id, ...memoryData } = parsed.data; return { success: true, memory: await memory.saveMemory({ userId: user_id, ...memoryData }) }; });
  app.get('/api/memory', async request => ({ memories: await memory.searchMemory(request.query?.user_id || config.defaultUserId, request.query?.q || '') }));
  app.delete('/api/memory/:memory_id', async request => { await memory.deleteMemory(request.query?.user_id || config.defaultUserId, request.params.memory_id); return { success: true }; });
  app.get('/api/history', async () => ({ messages: [] }));
  app.post('/api/tasks', async request => ({ success: true, task: { ...request.body, id: crypto.randomUUID(), status: 'pending' } })); app.get('/api/tasks', async () => ({ tasks: [] }));
  app.post('/api/tools/:tool_name', async (request, reply) => { const tool = tools[request.params.tool_name]; if (!tool) return reply.code(404).send({ success: false, error: 'tool_not_found' }); try { return { success: true, result: await tool.execute(request.body || {}) }; } catch (error) { return reply.code(400).send({ success: false, error: error.message }); } });
  app.post('/api/voice/transcribe', async () => ({ available: false, reason: 'voice_not_configured' })); app.post('/api/voice/speak', async () => ({ available: false, reason: 'voice_not_configured' })); app.post('/api/vision/analyze', async () => ({ available: false, reason: 'vision_not_configured' }));
  return app;
}
module.exports = { buildApp };

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
    const { user_id, message, history } = parsed.data; const context = await memory.getContext(user_id, message); let webResults = []; let response; let usedTools = [];
    try { const web = await searchWeb(message); webResults = web.results; if (webResults.length) { usedTools.push('web'); await memory.saveMemory({ userId: user_id, content: JSON.stringify(web), type: 'web_research', importance: 0.6, metadata: { query: message } }); } } catch { /* la IA puede responder con su conocimiento si la web no está disponible */ }
    if (localModelAvailable()) { try { const result = await answer({ message, history, memories: context.memories, webResults }); response = result.text; usedTools.push(...result.usedTools); } catch (error) { app.log.warn({ err: error.message }, 'local model unavailable; using web fallback'); } }
    if (!response) { response = webResults.length ? `Encontré estas fuentes en Internet:\n\n${webResults.map((r, i) => `${i + 1}. ${r.title}\n${r.snippet}\n${r.url}`).join('\n\n')}` : 'No encontré resultados web adicionales, pero puedo responder con mi cerebro embebido.'; usedTools.push('web-fallback'); }
    return { success: true, response, conversation_id: `conversation:${user_id}`, message_id: crypto.randomUUID(), used_tools: usedTools, storage: isConnected() ? 'firebase' : 'sessionStorage', local_model: usedTools.includes('local-model') };
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

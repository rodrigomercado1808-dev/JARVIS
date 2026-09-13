require('dotenv').config();
const path = require('node:path');

const config = {
  appName: process.env.APP_NAME || 'JARVIS',
  nodeEnv: process.env.NODE_ENV || 'development',
  host: process.env.HOST || '0.0.0.0',
  port: Number(process.env.PORT || 3000),
  search: { timeoutMs: Number(process.env.SEARCH_TIMEOUT_MS || 15000) },
  ai: {
    provider: process.env.AI_PROVIDER || 'none',
    baseUrl: process.env.AI_BASE_URL || '',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-5-mini',
    timeoutMs: Number(process.env.AI_TIMEOUT_MS || 60000)
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
  },
  authMode: process.env.AUTH_MODE || 'development',
  defaultUserId: process.env.DEFAULT_USER_ID || 'default',
  memoryEncryptionKey: process.env.MEMORY_ENCRYPTION_KEY || 'development-only-change-me',
  fileSandboxDir: path.resolve(process.env.FILE_SANDBOX_DIR || './storage/sandbox')
};

function publicConfig() {
  return { appName: config.appName, nodeEnv: config.nodeEnv, mode: config.ai.apiKey ? 'conversational-ai-with-web-fallback' : 'deterministic-web-search', aiProvider: config.ai.provider, aiConfigured: Boolean(config.ai.apiKey && config.ai.baseUrl && config.ai.model), firebaseConfigured: Boolean(config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey), memoryEncryption: true };
}
module.exports = { config, publicConfig };

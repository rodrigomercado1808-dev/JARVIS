require('dotenv').config();
const path = require('node:path');

const config = {
  appName: process.env.APP_NAME || 'JARVIS',
  nodeEnv: process.env.NODE_ENV || 'development',
  host: process.env.HOST || '0.0.0.0',
  port: Number(process.env.PORT || 3000),
  search: { timeoutMs: Number(process.env.SEARCH_TIMEOUT_MS || 15000) },
  localModelPath: path.resolve(process.env.LOCAL_MODEL_PATH || './brain/checkpoints/jarvis.pt'),
  localTokenizerPath: path.resolve(process.env.LOCAL_TOKENIZER_PATH || './brain/tokenizer.json'),
  pythonCommand: process.env.PYTHON_COMMAND || 'python3',
  localInferScript: path.resolve('./brain/infer.py'),
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
  return { appName: config.appName, nodeEnv: config.nodeEnv, mode: 'embedded-brain-with-context', embeddedBrain: true, optionalTransformer: require('node:fs').existsSync(config.localModelPath), firebaseConfigured: Boolean(config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey), memoryEncryption: true };
}
module.exports = { config, publicConfig };

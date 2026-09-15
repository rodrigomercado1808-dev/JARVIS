require('dotenv').config();
const path = require('node:path');
const config = {
  appName: process.env.APP_NAME || 'JARVIS', nodeEnv: process.env.NODE_ENV || 'development', host: process.env.HOST || '0.0.0.0', port: Number(process.env.PORT || 3000), search: { timeoutMs: Number(process.env.SEARCH_TIMEOUT_MS || 15000) },
  firebase: { projectId: process.env.FIREBASE_PROJECT_ID || '', clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '', privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'), webApiKey: process.env.FIREBASE_WEB_API_KEY || '', webAuthDomain: process.env.FIREBASE_WEB_AUTH_DOMAIN || '', webStorageBucket: process.env.FIREBASE_WEB_STORAGE_BUCKET || '', webMessagingSenderId: process.env.FIREBASE_WEB_MESSAGING_SENDER_ID || '', webAppId: process.env.FIREBASE_WEB_APP_ID || '' },
  authMode: process.env.AUTH_MODE || 'development', defaultUserId: process.env.DEFAULT_USER_ID || 'default', memoryEncryptionKey: process.env.MEMORY_ENCRYPTION_KEY || 'development-only-change-me', fileSandboxDir: path.resolve(process.env.FILE_SANDBOX_DIR || './storage/sandbox')
};
function publicConfig() { return { appName: config.appName, nodeEnv: config.nodeEnv, mode: 'javascript-neural-brain-with-context', embeddedBrain: true, weightsVersion: '1.0.0', firebaseConfigured: Boolean(config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey), firebaseWebConfigured: Boolean(config.firebase.webApiKey && config.firebase.webAuthDomain && config.firebase.webAppId), memoryEncryption: true }; }
function firebaseWebConfig() { return { apiKey: config.firebase.webApiKey, authDomain: config.firebase.webAuthDomain, projectId: config.firebase.projectId, storageBucket: config.firebase.webStorageBucket, messagingSenderId: config.firebase.webMessagingSenderId, appId: config.firebase.webAppId }; }
module.exports = { config, publicConfig, firebaseWebConfig };

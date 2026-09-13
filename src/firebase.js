const { config } = require('./config');
let db = null;
let initialized = false;

function initFirebase() {
  if (initialized) return db;
  initialized = true;
  if (!config.firebase.projectId || !config.firebase.clientEmail || !config.firebase.privateKey) return null;
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert({ projectId: config.firebase.projectId, clientEmail: config.firebase.clientEmail, privateKey: config.firebase.privateKey }) });
    db = admin.firestore();
    return db;
  } catch (error) {
    console.error('[firebase] initialization failed:', error.message);
    return null;
  }
}
function isConnected() { return Boolean(initFirebase()); }
module.exports = { initFirebase, isConnected };

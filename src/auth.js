const { initFirebase } = require('./firebase');
const { config } = require('./config');
function adminAuth() { const db = initFirebase(); if (!db) return null; try { return require('firebase-admin').auth(); } catch { return null; } }
async function verifyToken(request) { const header = request.headers.authorization || ''; if (!header.startsWith('Bearer ')) return null; const auth = adminAuth(); if (!auth) return null; try { return await auth.verifyIdToken(header.slice(7)); } catch { return null; } }
async function resolveUser(request, requestedId) { const token = await verifyToken(request); if (token?.uid) return { uid: token.uid, authenticated: true, email: token.email || null }; if (config.authMode === 'development') return { uid: requestedId || config.defaultUserId, authenticated: false, email: null }; return null; }
module.exports = { verifyToken, resolveUser };

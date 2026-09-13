const crypto = require('node:crypto');
const { initFirebase } = require('./firebase');
const { seal, open } = require('./secure-storage');

class MemoryManager {
  constructor() { this.local = new Map(); }
  collection(userId) { return initFirebase()?.collection('users').doc(userId).collection('memories') || null; }
  async saveMemory({ userId, content, type = 'general', importance = 0.5, metadata = {} }) {
    const id = crypto.randomUUID(); const item = { id, userId, content, type, importance, metadata, createdAt: new Date().toISOString() }; const encrypted = await seal(item); const record = { id, type, importance, createdAt: item.createdAt, encrypted };
    const col = this.collection(userId); if (col) await col.doc(id).set(record); else { const list = this.local.get(userId) || []; list.push(record); this.local.set(userId, list); } return item;
  }
  async records(userId) { const col = this.collection(userId); if (col) { const snap = await col.orderBy('createdAt', 'desc').limit(100).get(); return snap.docs.map(d => d.data()); } return this.local.get(userId) || []; }
  async searchMemory(userId, query = '', limit = 10) { const terms = query.toLowerCase().split(/\s+/).filter(Boolean); const list = []; for (const record of await this.records(userId)) { try { const item = await open(record.encrypted); if (!terms.length || terms.some(t => item.content.toLowerCase().includes(t))) list.push(item); } catch { /* registro ilegible por clave incorrecta: se ignora sin romper el servicio */ } } return list.sort((a,b) => b.importance-a.importance).slice(0, limit); }
  async deleteMemory(userId, id) { const col = this.collection(userId); if (col) await col.doc(id).delete(); this.local.set(userId, (this.local.get(userId) || []).filter(x => x.id !== id)); }
  async getRecentConversation(userId, limit = 20) { const list = this.local.get(`conversation:${userId}`) || []; return list.slice(-limit); }
  async saveMessage(userId, message) { const list = this.local.get(`conversation:${userId}`) || []; list.push({ ...message, createdAt: new Date().toISOString() }); this.local.set(`conversation:${userId}`, list); return list.at(-1); }
  async getContext(userId, query) { return { memories: await this.searchMemory(userId, query, 5), recentMessages: await this.getRecentConversation(userId, 12) }; }
}
module.exports = { MemoryManager };

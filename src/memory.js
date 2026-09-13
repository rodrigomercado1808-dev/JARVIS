const crypto = require('node:crypto');
const { initFirebase } = require('./firebase');
const { seal, open } = require('./secure-storage');

class MemoryManager {
  collection(userId) { return initFirebase()?.collection('users').doc(userId).collection('memories') || null; }
  async saveMemory({ userId, content, type = 'general', importance = 0.5, metadata = {} }) {
    const id = crypto.randomUUID(); const item = { id, userId, content, type, importance, metadata, createdAt: new Date().toISOString() }; const col = this.collection(userId);
    if (col) { await col.doc(id).set({ id, type, importance, createdAt: item.createdAt, encrypted: await seal(item) }); return { ...item, storage: 'firebase' }; }
    return { ...item, storage: 'sessionStorage' };
  }
  async records(userId) { const col = this.collection(userId); if (!col) return []; const snap = await col.orderBy('createdAt', 'desc').limit(100).get(); return snap.docs.map(d => d.data()); }
  async searchMemory(userId, query = '', limit = 10) { const terms = query.toLowerCase().split(/\s+/).filter(Boolean); const list = []; for (const record of await this.records(userId)) { try { const item = await open(record.encrypted); if (!terms.length || terms.some(t => item.content.toLowerCase().includes(t))) list.push(item); } catch { /* clave incorrecta: no se expone contenido */ } } return list.sort((a,b) => b.importance-a.importance).slice(0, limit); }
  async deleteMemory(userId, id) { const col = this.collection(userId); if (col) await col.doc(id).delete(); return { storage: col ? 'firebase' : 'sessionStorage' }; }
  async getRecentConversation() { return []; }
  async saveMessage(userId, message) { return { ...message, userId, createdAt: new Date().toISOString() }; }
  async getContext(userId, query) { return { memories: await this.searchMemory(userId, query, 5), recentMessages: [] }; }
}
module.exports = { MemoryManager };

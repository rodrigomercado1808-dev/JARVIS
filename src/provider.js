const { config } = require('./config');

class AIProvider {
  get configured() { return Boolean(config.ai.apiKey && config.ai.baseUrl && config.ai.model); }
  get name() { return config.ai.provider; }
  async chat({ message, history = [], memories = [], webResults = [] }) {
    if (!this.configured) return null;
    const memoryText = memories.length ? `Memoria relevante:\n${memories.map(m => `- ${m.content}`).join('\n')}` : 'No hay memoria relevante.';
    const webText = webResults.length ? `Fuentes web disponibles; úsalas solo si aportan datos relevantes:\n${webResults.map((r, i) => `${i + 1}. ${r.title} — ${r.snippet} (${r.url})`).join('\n')}` : 'No se adjuntaron fuentes web.';
    const messages = [
      { role: 'system', content: 'Eres JARVIS, un asistente personal conversacional experto. Responde en español salvo que el usuario pida otro idioma. Comprende el contexto y usa el historial sin repetir preguntas ya respondidas. Puedes explicar programación, arquitectura de software, matemáticas, física clásica, relatividad, física cuántica, ciencia, historia y temas generales. Para código, entrega soluciones completas, seguras y explica supuestos. Distingue hechos de hipótesis; no inventes fuentes ni datos. No reveles cadenas de razonamiento privadas: ofrece conclusiones, pasos verificables y una explicación clara. Si no tienes información suficiente, dilo y pide el dato que falta.' },
      { role: 'system', content: memoryText },
      { role: 'system', content: webText },
      ...history.slice(-16).map(item => ({ role: item.role === 'assistant' ? 'assistant' : 'user', content: String(item.content).slice(0, 12000) })),
      { role: 'user', content: message }
    ];
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), config.ai.timeoutMs);
    try { const response = await fetch(`${config.ai.baseUrl.replace(/\/$/, '')}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.ai.apiKey}` }, body: JSON.stringify({ model: config.ai.model, messages, temperature: 0.2 }), signal: controller.signal }); if (!response.ok) throw new Error(`AI provider returned ${response.status}`); const data = await response.json(); return { text: data.choices?.[0]?.message?.content || 'El proveedor no devolvió contenido.', usedTools: ['brain'] }; } finally { clearTimeout(timer); }
  }
}
module.exports = { AIProvider };

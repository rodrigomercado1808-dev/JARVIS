const fs = require('node:fs');
const path = require('node:path');
const { classifyDomain, classifyIntent, rankContext, weights } = require('./neural-engine');
const knowledge = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'brain', 'knowledge.json'), 'utf8'));
function memoryText(memory) { if (memory.type !== 'learned_research') return memory.content; try { const learned = JSON.parse(memory.content); return learned.learned?.map(item => `${item.title}: ${item.snippet}`).join(' ') || memory.content; } catch { return memory.content; } }

function codeAnswer(message, domain) { const query = message.toLowerCase(); const examples = domain.examples || {}; const language = query.includes('python') ? 'python' : query.includes('node') ? 'node' : 'javascript'; const example = examples[language] || examples.javascript; return `${domain.intro}\n\nPara construirlo de forma segura, separaría validación, lógica y manejo de errores. Un ejemplo base en ${language} es:\n\n\`\`\`${language}\n${example}\n\`\`\`\n\nDecisiones importantes:\n- valida las entradas;\n- mantén cada responsabilidad en una función o módulo;\n- prueba los casos normales y los errores;\n- no guardes claves ni datos sensibles en el código.`; }
function answer({ message, history = [], memories = [], webResults = [] }) { const domainResult = classifyDomain(message, history); const intentResult = classifyIntent(message); const domain = knowledge.domains[domainResult.label] || knowledge.domains.general; const related = rankContext(message, history, memories); let response;
  if (intentResult.label === 'greeting') response = 'Hola. Soy JARVIS. Mi cerebro local está activo y puedo ayudarte con programación, física, física cuántica y explicaciones paso a paso.';
  else if (intentResult.label === 'deep' && related.length) response = `Continuando el contexto más relevante:\n\n${related[0].content}\n\n${domain.intro}\n\n${domain.facts.slice(0, 4).map(f => `• ${f}`).join('\n')}`;
  else if (intentResult.label === 'code' && domainResult.label === 'programming') response = codeAnswer(message, domain);
  else response = `${domain.intro}\n\n${domain.facts.slice(0, 5).map(f => `• ${f}`).join('\n')}${domain.example ? `\n\nEjemplo:\n${domain.example}` : ''}${related.length && related[0].relevance > 0.2 ? `\n\nContexto relacionado:\n${related.slice(0, 2).map(x => `• ${x.content}`).join('\n')}` : ''}`;
  if (memories.length) response += `\n\nMemoria relevante:\n${memories.slice(0, 3).map(m => `• ${memoryText(m)}`).join('\n')}`;
  if (webResults.length) response += `\n\nAprendí y contrasté esta respuesta con información externa disponible, pero la respuesta está sintetizada por mi cerebro local.`;
  return { text: response, usedTools: ['embedded-brain', 'neural-weights', 'context-engine', ...(webResults.length ? ['learned-web-context'] : [])], domain: domainResult.label, intent: intentResult.label, confidence: domainResult.probabilities[domainResult.label] };
}
function localModelAvailable() { return true; }
module.exports = { answer, localModelAvailable, classifyDomain, classifyIntent, detectDomain: classifyDomain, detectIntent: classifyIntent, knowledge, weights };

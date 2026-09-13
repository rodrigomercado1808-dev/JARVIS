const path = require('node:path');
const { spawn } = require('node:child_process');
const { config } = require('./config');
function localModelAvailable() { return require('node:fs').existsSync(config.localModelPath) && require('node:fs').existsSync(config.localTokenizerPath); }
function promptFor({ message, history, memories, webResults }) { return ['### JARVIS CONTEXT', ...history.slice(-12).map(x => `${x.role}: ${x.content}`), memories.length ? `MEMORY: ${memories.map(x => x.content).join(' | ')}` : '', webResults.length ? `SOURCES: ${webResults.map(x => `${x.title}: ${x.snippet}`).join(' | ')}` : '', `user: ${message}`, 'assistant:'].filter(Boolean).join('\n'); }
function answer(input) { if (!localModelAvailable()) return Promise.resolve(null); return new Promise((resolve, reject) => { const child=spawn(config.pythonCommand,[config.localInferScript,'--model',config.localModelPath,'--prompt',promptFor(input)],{cwd:path.resolve(__dirname,'..')}); let out='',err=''; child.stdout.on('data',d=>out+=d); child.stderr.on('data',d=>err+=d); child.on('error',reject); child.on('close',code=>code===0?resolve({text:out.trim(),usedTools:['local-model']}):reject(new Error(err||`local model exited ${code}`))); }); }
module.exports={answer,localModelAvailable};

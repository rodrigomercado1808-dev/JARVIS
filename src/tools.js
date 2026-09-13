const os = require('node:os');
const fs = require('node:fs/promises');
const path = require('node:path');
const { config } = require('./config');

function calculate(expression) { if (!/^[0-9+\-*/().%\s]+$/.test(expression)) throw new Error('Expresión no permitida'); return Function(`"use strict"; return (${expression})`)(); }
const tools = {
  calculator: { name: 'calculator', description: 'Calcula expresiones aritméticas simples.', execute: ({ expression }) => ({ result: calculate(expression) }) },
  datetime: { name: 'datetime', description: 'Obtiene fecha y hora ISO.', execute: () => ({ iso: new Date().toISOString() }) },
  system: { name: 'system', description: 'Obtiene información no sensible del sistema.', execute: () => ({ platform: process.platform, node: process.version, cpus: os.cpus().length, memoryGb: Math.round(os.totalmem() / 1024 ** 3) }) },
  web: { name: 'web', description: 'Abstracción preparada para integrar búsqueda web.', execute: async () => ({ available: false, reason: 'web_search_not_configured' }) },
  files: { name: 'files', description: 'Lista archivos únicamente dentro del sandbox.', execute: async ({ action = 'list', name = '' }) => { await fs.mkdir(config.fileSandboxDir, { recursive: true }); const target = path.resolve(config.fileSandboxDir, name); if (!target.startsWith(config.fileSandboxDir)) throw new Error('Ruta fuera del sandbox'); if (action === 'list') return { files: await fs.readdir(config.fileSandboxDir) }; if (action === 'read') return { content: await fs.readFile(target, 'utf8') }; throw new Error('Operación de archivos no permitida'); } }
};
function listTools() { return Object.values(tools).map(({ name, description }) => ({ name, description })); }
module.exports = { tools, listTools };

const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { promisify } = require('node:util');
const { config } = require('./config');

const gzip = promisify(zlib.gzip); const gunzip = promisify(zlib.gunzip);
function encryptionKey() { return crypto.createHash('sha256').update(config.memoryEncryptionKey || 'development-only-change-me').digest(); }
async function seal(value) { const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv); const compressed = await gzip(Buffer.from(JSON.stringify(value), 'utf8')); const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]); const tag = cipher.getAuthTag(); return { v: 1, alg: 'aes-256-gcm+gzip', iv: iv.toString('base64url'), tag: tag.toString('base64url'), data: ciphertext.toString('base64url') }; }
async function open(record) { const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(record.iv, 'base64url')); decipher.setAuthTag(Buffer.from(record.tag, 'base64url')); const compressed = Buffer.concat([decipher.update(Buffer.from(record.data, 'base64url')), decipher.final()]); return JSON.parse((await gunzip(compressed)).toString('utf8')); }
module.exports = { seal, open };

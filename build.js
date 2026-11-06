'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { gunzipSync } = require('node:zlib');
const root = __dirname;
const dist = path.join(root, 'dist');
const segments = [
  'source.00.b64', 'source.01.b64',
  'source.tail.00.b64', 'source.tail.01.b64', 'source.tail.02.b64',
  'source.tail.03.b64', 'source.tail.04.b64'
];
const encoded = segments.map((name) => {
  const file = path.join(root, name);
  if (!fs.existsSync(file)) throw new Error(`Missing source archive segment: ${name}`);
  return fs.readFileSync(file, 'utf8').trim();
}).join('');
const source = JSON.parse(gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8'));
for (const file of ['index.html', 'style.css', 'app.js', 'README.md', 'AGENT_CARD.md']) {
  if (typeof source[file] !== 'string') throw new Error(`Source archive missing ${file}`);
  fs.writeFileSync(path.join(root, file), source[file]);
}
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
for (const file of ['index.html', 'style.css', 'app.js', 'audio.js']) {
  const input = path.join(root, file);
  if (!fs.existsSync(input)) throw new Error(`Build input missing: ${file}`);
  fs.copyFileSync(input, path.join(dist, file));
}
console.log('UNIFIED built: 4 production assets -> dist/');

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Ensure vendor dir exists in dist
const distVendor = path.join(distDir, 'vendor');
if (!fs.existsSync(distVendor)) {
  fs.mkdirSync(distVendor, { recursive: true });
}

// Copy vendor files
const srcVendor = path.join(__dirname, 'vendor');
if (fs.existsSync(srcVendor)) {
  for (const f of fs.readdirSync(srcVendor)) {
    fs.copyFileSync(path.join(srcVendor, f), path.join(distVendor, f));
  }
}

// Copy public assets & html/js/css to dist
const filesToCopy = [
  'index.html',
  'style.css',
  'app.js',
  'lattice.js',
  'earth.js',
  'rose.js',
  'audio.js',
  'particles.js',
  'telemetry.js',
  'topo.js',
  'AGENT_CARD.md',
  'README.md'
];

for (const file of filesToCopy) {
  const src = path.join(__dirname, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, file));
  }
}

console.log('✓ unified built successfully with 3D Ceiling Tile Lattice, Singularity, Earth & Rose');

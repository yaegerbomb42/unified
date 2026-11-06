const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy public assets & html/js/css to dist
const filesToCopy = ['index.html', 'style.css', 'app.js', 'audio.js', 'particles.js', 'telemetry.js', 'topo.js'];
for (const file of filesToCopy) {
  const src = path.join(__dirname, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, file));
  }
}

console.log('✓ unified built successfully into dist/');

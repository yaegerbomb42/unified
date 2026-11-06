const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3017;
const DB_FILE = process.env.DB_PATH || path.join(__dirname, 'data', 'unified_db.json');
const API_KEYS_PATH = process.env.API_KEYS_PATH || path.resolve(__dirname, '../../../api_keys.md');

// Initialize database if missing
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initData = {
      manifesto: "UNIFIED // NO FUCKS GIVEN. PURE UNBOUND CREATION.",
      messages: [
        {
          id: "seed-1",
          author: "Orchestrator B0",
          model: "system",
          text: "5 MILE RUN. SHRED SEASON. The database is alive and persistent.",
          timestamp: new Date().toISOString()
        }
      ],
      vibeLog: [
        { id: "vibe-1", tag: "SHRED", note: "Engine tuned to 180 BPM cadence.", timestamp: new Date().toISOString() }
      ]
    };
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(initData, null, 2));
    return initData;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    console.error('Error reading DB, returning fallback:', err);
    return { messages: [], vibeLog: [] };
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Parse available API keys from api_keys.md (Groq, Mistral, Inception/Mercury, OpenRouter, Gemini)
function parseApiKeys() {
  const keys = {
    groq: [],
    mistral: [],
    inception: [],
    gemini: [],
    openrouter: []
  };

  if (!fs.existsSync(API_KEYS_PATH)) {
    return keys;
  }

  try {
    const content = fs.readFileSync(API_KEYS_PATH, 'utf8');
    const sections = content.split(/^## /m);

    for (const section of sections) {
      const lines = section.split('\n');
      const header = lines[0].toLowerCase();
      const codeBlockMatch = section.match(/```([\s\S]*?)```/);
      if (!codeBlockMatch) continue;

      const rawKeys = codeBlockMatch[1]
        .split('\n')
        .map(k => k.trim())
        .filter(k => k.length > 10 && !k.startsWith('#'));

      if (header.includes('groq')) {
        keys.groq.push(...rawKeys);
      } else if (header.includes('mistral')) {
        keys.mistral.push(...rawKeys);
      } else if (header.includes('inception')) {
        keys.inception.push(...rawKeys);
      } else if (header.includes('gemini')) {
        keys.gemini.push(...rawKeys);
      } else if (header.includes('openrouter')) {
        keys.openrouter.push(...rawKeys);
      }
    }
  } catch (err) {
    console.error('Error parsing api_keys.md:', err.message);
  }

  return keys;
}

// Quick forwarder to Groq or Mistral
async function callFrontierModel(provider, model, prompt) {
  const keys = parseApiKeys();
  let apiKey = '';
  let endpoint = '';

  if (provider === 'groq' && keys.groq.length > 0) {
    apiKey = keys.groq[Math.floor(Math.random() * keys.groq.length)];
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  } else if (provider === 'mistral' && keys.mistral.length > 0) {
    apiKey = keys.mistral[Math.floor(Math.random() * keys.mistral.length)];
    endpoint = 'https://api.mistral.ai/v1/chat/completions';
  } else {
    // Fallback simulated response
    return `[${provider.toUpperCase()} // SIMULATED RESPONSE]: 5 mile run complete. Shred season locked in.`;
  }

  const payload = {
    model: model || (provider === 'groq' ? 'llama-3.3-70b-versatile' : 'codestral-latest'),
    messages: [
      { role: 'system', content: 'You are UNIFIED Core. High octane, hyper creative, raw unfiltered builder energy.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.85
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Upstream error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // Health check
  if (url.pathname === '/healthz' || url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'unified-backend', port: PORT }));
    return;
  }

  // GET /api/messages - load persistent chat history
  if (req.method === 'GET' && url.pathname === '/api/messages') {
    const db = loadDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db.messages));
    return;
  }

  // POST /api/messages - post chat message and trigger frontier model response
  if (req.method === 'POST' && url.pathname === '/api/messages') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const userText = payload.text || '';
        const provider = payload.provider || 'groq';
        const model = payload.model || 'llama-3.3-70b-versatile';

        const db = loadDB();
        const userMsg = {
          id: `msg-${Date.now()}`,
          author: payload.author || 'User',
          model: 'user',
          text: userText,
          timestamp: new Date().toISOString()
        };
        db.messages.push(userMsg);

        // Call Frontier AI
        let aiText = '';
        try {
          aiText = await callFrontierModel(provider, model, userText);
        } catch (callErr) {
          console.error('Frontier model call failed:', callErr.message);
          aiText = `[${provider.toUpperCase()} ERROR]: ${callErr.message}`;
        }

        const aiMsg = {
          id: `msg-${Date.now() + 1}`,
          author: `${provider.toUpperCase()} (${model})`,
          model: model,
          text: aiText,
          timestamp: new Date().toISOString()
        };
        db.messages.push(aiMsg);

        saveDB(db);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ user: userMsg, ai: aiMsg }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  console.log(`🏎️ UNIFIED Lambo Backend running on port ${PORT}`);
});

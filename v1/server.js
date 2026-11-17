import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Load .env (no dependencies) ---
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) {
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch { /* .env not found, use defaults */ }

// --- Config ---
const PORT = 3000;
const KOBOLD_URL = process.env.KOBOLD_URL || 'http://127.0.0.1:5001';
const MAX_HISTORY = 20;          // mensagens no contexto
const SUMMARY_INTERVAL = 10;     // gera resumo a cada N pares (user+assistant)
const MAX_SUMMARIES = 20;        // máximo de resumos armazenados

// --- Load character ---
const character = JSON.parse(fs.readFileSync(path.join(__dirname, 'character.json'), 'utf-8'));

// --- Session state ---
let sessionHistory = [];  // {role, content}[]
let messageCount = 0;     // conta pares user+assistant

// --- Summaries (persistent) ---
const SUMMARIES_PATH = path.join(__dirname, 'data', 'summaries.json');

function loadSummaries() {
  try {
    return JSON.parse(fs.readFileSync(SUMMARIES_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function saveSummaries(summaries) {
  fs.mkdirSync(path.dirname(SUMMARIES_PATH), { recursive: true });
  fs.writeFileSync(SUMMARIES_PATH, JSON.stringify(summaries, null, 2), 'utf-8');
}

// --- Lorebook ---
function getRelevantLorebook(message) {
  const lower = message.toLowerCase();
  const entries = [];
  for (const [key, value] of Object.entries(character.lorebook)) {
    if (lower.includes(key) || key === 'nitrox') {
      entries.push(value);
    }
  }
  return entries;
}

// --- Emotion detection ---
function detectEmotion(response) {
  const lower = response.toLowerCase();
  for (const keyword of character.emotion_keywords.happy) {
    if (lower.includes(keyword)) return 'happy';
  }
  for (const keyword of character.emotion_keywords.thinking) {
    if (lower.includes(keyword)) return 'thinking';
  }
  return 'idle';
}

// --- Build prompt messages for KoboldCpp ---
function buildMessages(userMessage) {
  const messages = [];

  // System prompt
  let systemContent = character.system_prompt;

  // Add lorebook entries
  const lore = getRelevantLorebook(userMessage);
  if (lore.length > 0) {
    systemContent += '\n\nInformações relevantes:\n' + lore.map(l => `- ${l}`).join('\n');
  }

  // Add latest summary
  const summaries = loadSummaries();
  if (summaries.length > 0) {
    const latest = summaries[summaries.length - 1];
    systemContent += `\n\nResumo de conversas anteriores:\n${latest.summary}`;
  }

  messages.push({ role: 'system', content: systemContent });

  // Add example dialogues (as few-shot)
  for (const ex of character.example_dialogues.slice(0, 3)) {
    messages.push({ role: 'user', content: ex.user });
    messages.push({ role: 'assistant', content: ex.assistant });
  }

  // Add session history (limited)
  const recentHistory = sessionHistory.slice(-MAX_HISTORY);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Current message
  messages.push({ role: 'user', content: userMessage });

  return messages;
}

// --- Call KoboldCpp ---
async function callLLM(messages) {
  const body = JSON.stringify({
    model: 'qwen3-8b',
    messages,
    max_tokens: 512,
    temperature: 0.8,
    top_p: 0.9,
  });

  const url = new URL('/v1/chat/completions', KOBOLD_URL);

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KoboldCpp error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '...';
}

// --- Generate rolling summary ---
async function generateSummary() {
  const historyText = sessionHistory
    .map(m => `${m.role === 'user' ? 'Nitrox' : 'Nyx'}: ${m.content}`)
    .join('\n');

  const summaryPrompt = [
    {
      role: 'system',
      content: 'Você é um assistente que faz resumos concisos de conversas. Resuma a conversa abaixo em 2-3 frases curtas, capturando os pontos principais e decisões tomadas. Responda APENAS com o resumo, sem introdução.',
    },
    {
      role: 'user',
      content: `Resuma esta conversa:\n\n${historyText}`,
    },
  ];

  try {
    const summary = await callLLM(summaryPrompt);
    const summaries = loadSummaries();
    summaries.push({
      timestamp: new Date().toISOString(),
      summary: summary.trim(),
      messageCount: sessionHistory.length,
    });
    // Keep only last N summaries
    while (summaries.length > MAX_SUMMARIES) {
      summaries.shift();
    }
    saveSummaries(summaries);
    console.log('[Nyx] Rolling summary gerado.');
  } catch (err) {
    console.error('[Nyx] Erro ao gerar summary:', err.message);
  }
}

// --- Chat handler ---
async function handleChat(userMessage) {
  const messages = buildMessages(userMessage);
  const response = await callLLM(messages);

  // Clean thinking tags if model outputs them
  const cleanResponse = response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  // Save to session history
  sessionHistory.push({ role: 'user', content: userMessage });
  sessionHistory.push({ role: 'assistant', content: cleanResponse });
  messageCount++;

  // Check if it's time for a rolling summary
  if (messageCount > 0 && messageCount % SUMMARY_INTERVAL === 0) {
    // Fire and forget — don't block the response
    generateSummary().catch(() => {});
  }

  const emotion = detectEmotion(cleanResponse);

  return { response: cleanResponse, emotion };
}

// --- Static file server ---
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// --- Read JSON body ---
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

// --- HTTP Server ---
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API routes
  if (req.method === 'POST' && req.url === '/api/chat') {
    try {
      const { message } = await readBody(req);
      if (!message || typeof message !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Campo "message" é obrigatório.' }));
        return;
      }
      console.log(`[Nitrox] ${message}`);
      const result = await handleChat(message);
      console.log(`[Nyx] (${result.emotion}) ${result.response}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      console.error('[Erro]', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Não consegui me conectar ao KoboldCpp. Tá rodando?',
        details: err.message,
      }));
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/new-session') {
    // Generate summary before clearing if there's enough history
    if (sessionHistory.length >= 4) {
      await generateSummary().catch(() => {});
    }
    sessionHistory = [];
    messageCount = 0;
    console.log('[Nyx] Nova sessão iniciada.');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === 'GET' && req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: character.name,
      messages: sessionHistory.length,
      summaries: loadSummaries().length,
    }));
    return;
  }

  // Static files
  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`\n  ⬥ Nyx está acordando...`);
  console.log(`  ⬥ Interface: http://localhost:${PORT}`);
  console.log(`  ⬥ KoboldCpp: ${KOBOLD_URL}`);
  console.log(`  ⬥ Summaries: ${loadSummaries().length} salvos\n`);
});

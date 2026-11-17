// === NYX V1 — Frontend ===

const $ = (sel) => document.querySelector(sel);
const messagesEl = $('.messages');
const inputEl = $('#message-input');
const sendBtn = $('#send-btn');
const avatarEl = $('#avatar');
const statusDot = $('.status-dot');
const statusText = $('#status-text');
const newSessionBtn = $('#new-session-btn');

let isWaiting = false;

// --- Avatar ---
function setEmotion(emotion) {
  const valid = ['idle', 'happy', 'thinking'];
  const emo = valid.includes(emotion) ? emotion : 'idle';
  avatarEl.src = `/sprites/${emo}.png`;
}

// --- Messages ---
function addMessage(role, text) {
  // Remove welcome if present
  const welcome = $('.welcome');
  if (welcome) welcome.remove();

  // Remove typing indicator if present
  const typing = $('.typing-indicator');
  if (typing) typing.remove();

  const div = document.createElement('div');
  div.className = `message ${role}`;

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = role === 'user' ? 'Nitrox' : 'Nyx';

  const content = document.createElement('div');
  content.textContent = text;

  div.appendChild(label);
  div.appendChild(content);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addSystemMessage(text) {
  const div = document.createElement('div');
  div.className = 'message system';
  div.textContent = text;
  messagesEl.appendChild(div);
}

function showTyping() {
  const div = document.createElement('div');
  div.className = 'typing-indicator';
  div.innerHTML = 'Nyx está pensando<span>.</span><span>.</span><span>.</span>';
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTyping() {
  const typing = $('.typing-indicator');
  if (typing) typing.remove();
}

// --- API ---
async function sendMessage(text) {
  if (!text.trim() || isWaiting) return;

  isWaiting = true;
  sendBtn.disabled = true;
  setEmotion('thinking');

  addMessage('user', text);
  showTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });

    removeTyping();

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      addSystemMessage(err.error || 'Erro ao conectar com o servidor.');
      setEmotion('idle');
      statusDot.classList.add('offline');
      statusText.textContent = 'KoboldCpp offline';
      return;
    }

    const data = await res.json();
    addMessage('assistant', data.response);
    setEmotion(data.emotion || 'idle');
    statusDot.classList.remove('offline');
    statusText.textContent = 'Online';

    // Reset emotion after a few seconds
    setTimeout(() => setEmotion('idle'), 8000);

  } catch (err) {
    removeTyping();
    addSystemMessage('Não consegui falar com o servidor. Tá rodando?');
    setEmotion('idle');
    statusDot.classList.add('offline');
    statusText.textContent = 'Servidor offline';
  } finally {
    isWaiting = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }
}

async function newSession() {
  try {
    await fetch('/api/new-session', { method: 'POST' });
    messagesEl.innerHTML = '';

    // Re-add welcome
    const welcome = document.createElement('div');
    welcome.className = 'welcome';
    welcome.innerHTML = '<h2>⬥ Nyx</h2><p>Digite algo para começar...</p>';
    messagesEl.appendChild(welcome);

    setEmotion('idle');
    addSystemMessage('Nova sessão iniciada.');
  } catch {
    addSystemMessage('Erro ao criar nova sessão.');
  }
}

// --- Events ---
sendBtn.addEventListener('click', () => {
  sendMessage(inputEl.value);
  inputEl.value = '';
  inputEl.style.height = 'auto';
});

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage(inputEl.value);
    inputEl.value = '';
    inputEl.style.height = 'auto';
  }
});

// Auto-resize textarea
inputEl.addEventListener('input', () => {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
});

newSessionBtn.addEventListener('click', newSession);

// --- Init ---
async function checkStatus() {
  try {
    const res = await fetch('/api/status');
    if (res.ok) {
      statusDot.classList.remove('offline');
      statusText.textContent = 'Online';
    }
  } catch {
    statusDot.classList.add('offline');
    statusText.textContent = 'Servidor offline';
  }
}

checkStatus();
inputEl.focus();

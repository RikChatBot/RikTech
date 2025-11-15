const API_BASE = '/api';
let sessionId = localStorage.getItem('rik_session') || '';

document.getElementById('enterBtn').addEventListener('click', ()=>{
  document.getElementById('splash').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  loadHistory();
});

const chatEl = document.getElementById('chat');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');
const panel = document.getElementById('panel');

function appendMsg(role, text){
  const d = document.createElement('div'); d.className = 'msg ' + (role==='user'?'user':'bot');
  d.innerText = text; chatEl.appendChild(d); chatEl.scrollTop = chatEl.scrollHeight;
}

async function sendMessage(text){
  appendMsg('user', text);
  inputEl.value = '';
  const resp = await fetch(API_BASE + '/message', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, userId: 'local-user', message: text }) });
  const data = await resp.json();
  if (data.sessionId) { sessionId = data.sessionId; localStorage.setItem('rik_session', sessionId); }
  appendMsg('bot', data.text || '[no response]');
}

sendBtn.addEventListener('click', ()=>{
  const t = inputEl.value.trim(); if (!t) return; sendMessage(t);
});
inputEl.addEventListener('keydown', (e)=>{ if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBtn.click(); } });

document.getElementById('newConvo').addEventListener('click', (e)=>{ e.preventDefault(); sessionId = ''; localStorage.removeItem('rik_session'); chatEl.innerHTML=''; appendMsg('bot','Mulai percakapan baru — halo!'); });

document.getElementById('historyBtn').addEventListener('click', async (e)=>{
  e.preventDefault(); openPanel('History', await fetchHistory());
});

async function fetchHistory(){
  if (!sessionId) return 'Belum ada sesi aktif.';
  const data = localStorage.getItem('rik_history_' + sessionId) || 'Riwayat hanya tersedia di server dev.';
  return data;
}

document.getElementById('settingsBtn').addEventListener('click', (e)=>{ e.preventDefault(); openPanel('Settings', settingsHtml()); });

function settingsHtml(){
  return `
<div>Mode: <select id="modeSelect"><option value="empathetic">Empathetic</option><option value="technical">Technical</option></select></div>
<div style="margin-top:8px">Training: <label><input id="consentSave" type="checkbox" checked/> Izinkan simpan percakapan untuk improve</label></div>`;
}

document.getElementById('appInfoBtn').addEventListener('click', (e)=>{ e.preventDefault(); openPanel('Info Aplikasi', '<p>RikTech AI — versi lokal. AI ringan tanpa integrasi pihak ketiga.</p>'); });

document.getElementById('devInfoBtn').addEventListener('click', (e)=>{ e.preventDefault(); openPanel('Info Pengembang', '<p>RikTech — Developer: Anda. Email: developer@example.com</p>'); });

function openPanel(title, content){ panel.classList.remove('hidden'); document.getElementById('panelTitle').innerText = title; document.getElementById('panelBody').innerHTML = typeof content === 'string' ? content : '<pre>'+JSON.stringify(content,null,2)+'</pre>'; }

function loadHistory(){ appendMsg('bot','Halo — saya RikTech AI. Ketik pesan untuk mulai.'); }

window.rik = { sendMessage };

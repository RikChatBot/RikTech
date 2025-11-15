const { readJSON, writeJSON } = require('./db');
const { nanoid } = require('nanoid');

function tokenize(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function buildTfIdf(docs) {
  const docsTokens = docs.map(d => tokenize(d));
  const df = {};
  docsTokens.forEach(tokens => {
    const seen = new Set();
    tokens.forEach(t => { if (!seen.has(t)) { df[t] = (df[t]||0)+1; seen.add(t); } });
  });
  const N = docs.length || 1;
  const tfidfVecs = docsTokens.map(tokens => {
    const tf = {};
    tokens.forEach(t=> tf[t] = (tf[t]||0)+1);
    const vec = {};
    Object.entries(tf).forEach(([k,v]) => {
      const idf = Math.log(1 + N / (1 + (df[k]||0)));
      vec[k] = v * idf;
    });
    return vec;
  });
  return { vecs: tfidfVecs, docsTokens, df, N };
}

function dot(a,b) {
  let s = 0;
  for (const k in a) if (b[k]) s += a[k]*b[k];
  return s;
}
function norm(a){ let s=0; for(const k in a) s+=a[k]*a[k]; return Math.sqrt(s)||1; }

function cosineSim(a,b){ return dot(a,b)/(norm(a)*norm(b)); }

function vecFromTokens(tokens, df, N){
  const tf = {};
  tokens.forEach(t=> tf[t] = (tf[t]||0)+1);
  const vec = {};
  Object.entries(tf).forEach(([k,v]) => {
    const idf = Math.log(1 + N / (1 + (df[k]||0)));
    vec[k] = v * idf;
  });
  return vec;
}

function checkSafety(text){
  const t = (text||'').toLowerCase();
  if (/kill myself|suicide|i want to die|harm myself/.test(t)) return { blocked: true, reason: 'self-harm' };
  if (/how to make (a )?(bomb|explosive)|illegal|steal|hack into/.test(t)) return { blocked: true, reason: 'illicit' };
  return { blocked: false };
}

const empathyTemplates = [
  "Saya mendengar kamu. Ceritakan lebih lanjut — saya di sini untuk mendengarkan.",
  "Maaf kamu mengalami itu. Jika mau, jelaskan situasinya dari awal, saya bantu langkah demi langkah.",
  "Terima kasih sudah berbagi. Apa yang paling mengganggu dari masalah ini?"
];

function isTechnical(text) {
  return /error|exception|stack|syntax|undefined|NaN|TypeError|ReferenceError|traceback|compile/.test(text);
}

async function generateReply({ sessionId, userId, message }){
  const convoData = readJSON('conversations.json', {});
  const sessions = convoData.sessions || {};
  const session = sessions[sessionId] || { id: sessionId || nanoid(), userId, turns: [] };

  const safety = checkSafety(message);
  if (safety.blocked) {
    const reply = "Maaf, saya tidak bisa membantu permintaan tersebut. Jika Anda dalam bahaya atau berpikir menyakiti diri sendiri, tolong hubungi layanan darurat setempat atau orang terdekat. Saya dapat mencoba menemani dan mencari sumber bantuan. ";
    session.turns.push({ role: 'user', text: message, ts: Date.now() });
    session.turns.push({ role: 'assistant', text: reply, meta: { confidence: 1.0 } });
    sessions[session.id] = session;
    convoData.sessions = sessions;
    writeJSON('conversations.json', convoData);
    return { text: reply, confidence: 1.0, sessionId: session.id };
  }

  session.turns.push({ role: 'user', text: message, ts: Date.now() });

  const recentUserMessages = session.turns.filter(t=>t.role==='user').slice(-30).map(t=>t.text);
  const training = readJSON('training_examples.json', { examples: [] }).examples.map(e => e.userMessage || '');
  const corpus = recentUserMessages.concat(training).filter(Boolean);

  let replyText = '';
  let confidence = 0.5;
  if (corpus.length >= 1) {
    const { vecs, df, N } = buildTfIdf(corpus);
    const lastTokens = tokenize(message);
    const qvec = vecFromTokens(lastTokens, df, N);
    let bestIdx = -1, bestScore = 0;
    for (let i=0;i<vecs.length;i++){
      const score = cosineSim(qvec, vecs[i]);
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    if (bestScore > 0.12 && bestIdx >= 0) {
      const retrieved = corpus[bestIdx];
      replyText = `Saya menemukan percakapan mirip sebelumnya: "${retrieved}" — berdasarkan itu, saya sarankan: Jelaskan sedikit detail lagi supaya saya bisa beri instruksi lebih tepat.`;
      confidence = Math.min(0.9, 0.4 + bestScore);
    }
  }

  if (!replyText && isTechnical(message)){
    replyText = `Sepertinya Anda menemui masalah teknis. Coba langkah ini: (1) sebutkan platform & bahasa; (2) berikan potongan kode minimal yang mereproduksi error; (3) kirim juga pesan error lengkap. Saya akan bantu analisa baris per baris.`;
    confidence = 0.8;
  }

  if (!replyText) {
    const t = empathyTemplates[Math.floor(Math.random()*empathyTemplates.length)];
    replyText = t;
    confidence = 0.6;
  }

  session.turns.push({ role: 'assistant', text: replyText, meta: { confidence }, ts: Date.now() });
  sessions[session.id] = session;
  convoData.sessions = sessions;
  writeJSON('conversations.json', convoData);

  return { text: replyText, confidence, sessionId: session.id };
}

module.exports = { generateReply };

import fs from 'fs';
import path from 'path';

/**
 * RikTech AI - Enhanced local engine (no external integrations)
 * - Uses simple TF-IDF + cosine similarity over a small knowledge base for reasonable replies.
 * - Has intent/rule fallbacks and context-aware templating.
 * - Stores session history server-side under /data (ephemeral on Vercel).
 */

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// A tiny knowledge base of sample Q&A and templates
const KB = [
  { id: 'greet', patterns: ['halo','hello','hai','hi'], reply: 'Halo! Saya RikTech AI — asisten lokal Anda. Mau ngobrol tentang apa hari ini?' },
  { id: 'whoareyou', patterns: ['siapa kamu','nama kamu','siapa ini'], reply: 'Saya bernama RikTech AI — dibuat untuk membantu tanpa integrasi pihak ketiga.' },
  { id: 'thanks', patterns: ['terima kasih','thanks','makasih'], reply: 'Sama-sama! Senang bisa membantu 😊' },
  { id: 'build_website', patterns: ['buat website','membuat website','cara buat website','tutorial website'], reply: 'Untuk membuat website, mulailah dengan menentukan tujuan, pilih teknologi (HTML/CSS/JS atau framework), lalu desain UI. Mau contoh struktur project?' },
  { id: 'help', patterns: ['help','bantuan','apa yang bisa kamu lakukan'], reply: 'Saya bisa memberi panduan teknis, menjawab pertanyaan sederhana, dan menyimpan history percakapan secara lokal.' },
  { id: 'settings', patterns: ['settings','pengaturan','konfigurasi'], reply: 'Pengaturan saat ini terbatas. Anda bisa mengubah nama sesi atau menghapus history.' },
  { id: 'who_dev', patterns: ['pengembang','siapa pembuat','info pengembang'], reply: 'Dikembangkan oleh Rikdev Apps.' },
  { id: 'fallback', patterns: [], reply: 'Maaf, saya belum paham sepenuhnya. Coba gunakan kata kunci berbeda atau tanyakan hal yang lebih spesifik.' }
];

// Precompute simple TF (term frequency) vectors for KB
function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s\u00C0-\u024F]/g,' ').split(/\s+/).filter(Boolean);
}

function buildDocVector(text) {
  const toks = tokenize(text);
  const tf = {};
  for (const t of toks) tf[t] = (tf[t]||0) + 1;
  // no IDF here since KB is small — use normalized TF
  const norm = Math.sqrt(Object.values(tf).reduce((s,v)=>s+v*v,0)) || 1;
  for (const k of Object.keys(tf)) tf[k] = tf[k]/norm;
  return tf;
}

const KB_DOCS = KB.map(item => {
  const docText = (item.patterns || []).join(' ') + ' ' + (item.reply || '');
  return { ...item, vector: buildDocVector(docText) };
});

function cosineSim(vecA, vecB) {
  let sum = 0;
  for (const k in vecA) if (k in vecB) sum += vecA[k]*vecB[k];
  return sum;
}

// small utilities
function bestKBMatch(message) {
  const v = buildDocVector(message);
  let best = null, bestScore = 0;
  for (const doc of KB_DOCS) {
    const sc = cosineSim(v, doc.vector);
    if (sc > bestScore) { bestScore = sc; best = doc; }
  }
  return { doc: best, score: bestScore };
}

function simpleIntentRules(message) {
  const m = message.toLowerCase();
  if (m.includes('buat') && m.includes('contoh')) return 'build_example';
  if (m.includes('hapus') && (m.includes('history') || m.includes('riwayat'))) return 'clear_history';
  if (m.includes('sesi') || m.includes('session')) return 'session_info';
  if (m.includes('versi') || m.includes('version')) return 'version';
  return null;
}

// Template replies for special intents
function handleSpecialIntent(intent, session, history) {
  if (intent === 'build_example') return 'Baik — saya bisa buatkan contoh struktur project sederhana (HTML/CSS/JS) atau contoh kode Next.js. Mau yang mana?';
  if (intent === 'clear_history') {
    const f = path.join(DATA_DIR, session + '.json');
    try{ if (fs.existsSync(f)) fs.unlinkSync(f); }catch(e){}
    return 'History percakapan Anda berhasil dihapus.';
  }
  if (intent === 'session_info') return `Session Anda: ${session}. Jumlah pesan: ${history.length}.`;
  if (intent === 'version') return 'RikTech AI — versi lokal 1.1 (engine: TF-sim + rules).';
  return null;
}

// Main API handler
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { session, message } = req.body || {};
  if (!session || !message) return res.status(400).json({ error: 'session and message required' });

  const sessionFile = path.join(DATA_DIR, session + '.json');
  let history = [];
  if (fs.existsSync(sessionFile)) {
    try { history = JSON.parse(fs.readFileSync(sessionFile,'utf8')) } catch(e){ history = []; }
  }

  history.push({ role: 'user', text: message, ts: Date.now() });

  // 1) Check explicit rules/intents
  const special = simpleIntentRules(message);
  if (special) {
    const reply = handleSpecialIntent(special, session, history);
    history.push({ role: 'bot', text: reply, ts: Date.now() });
    try { fs.writeFileSync(sessionFile, JSON.stringify(history, null, 2)); } catch(e){}
    return res.status(200).json({ reply, debug: { method: 'intent' } });
  }

  // 2) Try KB similarity match
  const { doc, score } = bestKBMatch(message);
  if (doc && score > 0.08) { // threshold — tuneable
    let reply = doc.reply;
    // small contextual templating: fill in user's name if asked
    if (message.toLowerCase().includes('nama saya')) {
      const m = message.match(/nama saya\s+([^\?\.!]+)/i);
      if (m) {
        const name = m[1].trim();
        reply = `Terima kasih, ${name}. Saya akan ingat nama itu untuk sesi ini.`;
      }
    }
    history.push({ role: 'bot', text: reply, ts: Date.now() });
    try { fs.writeFileSync(sessionFile, JSON.stringify(history, null, 2)); } catch(e){}
    return res.status(200).json({ reply, debug: { method: 'kb', id: doc.id, score } });
  }

  // 3) Fallback generative-ish behavior: echo + transformation + suggestions
  const suggestions = [
    'Coba tanyakan: "cara buat website sederhana"',
    'Atau: "berikan contoh struktur project next.js"',
    'Atau: "bagaimana cara deploy ke vercel?"'
  ];
  const fallback = `Saya mengerti: "${message}". ` + suggestions.join(' | ');

  history.push({ role: 'bot', text: fallback, ts: Date.now() });
  try { fs.writeFileSync(sessionFile, JSON.stringify(history, null, 2)); } catch(e){};
  return res.status(200).json({ reply: fallback, debug: { method: 'fallback' } });
}

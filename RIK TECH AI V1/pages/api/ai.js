// RikTech AI - Enhanced local AI endpoint
// POST { message: string, sessionId?: string, action?: string }
// Responses: { reply, id, intent, suggestions }
let sessionStore = global.__RIK_SESSION_STORE || (global.__RIK_SESSION_STORE = {})

function detectIntent(text) {
  const t = text.toLowerCase()
  if (/^\s*$/.test(t)) return 'empty'
  if (/\b(halo|hi|hai|hello)\b/.test(t)) return 'greeting'
  if (/\b(aturan|fitur|bisa|apa yang bisa)\b/.test(t)) return 'features'
  if (/\b(terima kasih|makasih)\b/.test(t)) return 'thanks'
  if (/\b(joke|lucu|humor)\b/.test(t)) return 'joke'
  if (/\b(code|kode|react|javascript|python|contoh)\b/.test(t)) return 'code_help'
  if (/\b(summarize|ringkas|ringkasan|summarize:)\b/.test(t)) return 'summarize'
  if (/\b(translate to|terjemah|translate)\b/.test(t)) return 'translate'
  return 'unknown'
}

function aiResponse(message, intent) {
  const id = `rik-${Date.now()}`
  let reply = ''
  let suggestions = []

  switch(intent) {
    case 'empty':
      reply = 'Halo! Saya RikTech AI — tulis sesuatu supaya saya bisa bantu.'
      break
    case 'greeting':
      reply = 'Halo! Saya RikTech AI. Mau tanya tentang apa? (mis. kode, ringkasan, terjemah, atau minta fitur).'
      suggestions = ['Tunjukkan fitur', 'Buat contoh React small component', 'Bantu ringkas teks']
      break
    case 'features':
      reply = 'Saya dapat: (1) menjawab pertanyaan umum, (2) membantu dengan contoh kode, (3) ringkasan teks sederhana, (4) deteksi intent, (5) history session lokal. Semua berjalan tanpa layanan eksternal.'
      break
    case 'thanks':
      reply = 'Sama-sama — senang membantu! 💙'
      break
    case 'joke':
      reply = 'Kenapa programmer sering lupa hari ulang tahun? Karena mereka selalu menghitung dalam binary. 😄'
      break
    case 'code_help':
      reply = 'Saya bisa bantu contoh kode. Berikut contoh kecil komponen React functional untuk menampilkan greeting yang bisa kamu pakai langsung:'
      reply += '\n\n' + [
        "function Greeting({name}) {",
        "  return (<div style={{padding:12,border:'1px solid #eee',borderRadius:8}}>Hai, {name}!</div>)",
        "}",
        "export default Greeting;"
      ].join('\n')
      suggestions = ['Jelaskan baris per baris', 'Buat versi class component', 'Tambahkan state']
      break
    case 'summarize':
      // simple summarization: return first 220 characters + note
      const short = message.trim().slice(0, 220)
      reply = 'Ringkasan (sederhana):\n' + (short.length < message.trim().length ? short + '...' : short)
      suggestions = ['Ringkas lagi (lebih pendek)', 'Ekstrak poin penting']
      break
    case 'translate':
      // very simple pseudo-translate: detect target language
      if (/translate to indonesian|translate to bahasa/i.test(message)) {
        reply = 'Terjemahan (sederhana): Saya mampu membantu terjemahan sederhana — tapi ini bukan penerjemah profesional. Silakan masukkan kalimat yang ingin diterjemahkan.'
      } else {
        reply = 'Perintah translate diterima — sebutkan bahasa tujuan, contoh: "translate to Indonesian: Hello world"'
      }
      break
    default:
      // smarter fallback: attempt to transform, suggest actions
      const words = message.split(/(\s+)/).filter(Boolean)
      const reversed = words.slice().reverse().join(' ')
      reply = `Saya menerima: "${message}".\nCoba versi ringkas atau balik katanya: "${reversed}".\nJika butuh kode, tambahkan kata 'kode' atau 'contoh'.`
      suggestions = ['Minta contoh kode', 'Minta ringkasan', 'Tanya fitur']
  }

  return { id, reply, intent, suggestions }
}

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { message, sessionId } = req.body || {}
  if (typeof message !== 'string') return res.status(400).json({ error: 'Missing message string' })

  const intent = detectIntent(message)
  const result = aiResponse(message, intent)

  // store into session (in-memory, ephemeral)
  const sid = sessionId || `s-${(req.headers['x-forwarded-for'] || 'local').toString().replace(/[^a-z0-9.-]/ig,'')}-${Date.now()}`
  if (!sessionStore[sid]) sessionStore[sid] = []
  sessionStore[sid].push({ from: 'user', text: message, ts: Date.now() })
  sessionStore[sid].push({ from: 'ai', text: result.reply, ts: Date.now(), id: result.id, intent })

  res.status(200).json({ reply: result.reply, id: result.id, intent, suggestions: result.suggestions, sessionId: sid })
}

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

function Splash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="splash">
      <div className="splash-card">
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="4"/></svg>
        <h1>RikTech AI</h1>
      </div>
    </div>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [session, setSession] = useState('');

  useEffect(() => {
    const s = localStorage.getItem('riktech_session') || uuidv4();
    localStorage.setItem('riktech_session', s);
    setSession(s);
  }, []);

  useEffect(() => {
    const hist = localStorage.getItem('riktech_history_' + session);
    if (hist) setMessages(JSON.parse(hist));
  }, [session]);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(()=> setLoading(false), 1000);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    localStorage.setItem('riktech_history_' + session, JSON.stringify(messages));
  }, [messages, session]);

  async function sendMessage(e) {
    e?.preventDefault();
    if (!input.trim()) return;
    const userMsg = { from: 'user', text: input.trim(), ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    // call API
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, message: userMsg.text })
      });
      const data = await res.json();
      const botMsg = { from: 'bot', text: data.reply, ts: Date.now() };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const botMsg = { from: 'bot', text: 'Maaf, terjadi kesalahan pada server.', ts: Date.now() };
      setMessages(prev => [...prev, botMsg]);
    }
  }

  function clearHistory() {
    setMessages([]);
    localStorage.removeItem('riktech_history_' + session);
  }

  return (
    <>
      {loading ? <Splash onDone={() => setLoading(false)} /> : null}
      <div className="app">
        <header className="header">
          <div className="brand">
            <div className="logo" aria-hidden>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="6"/></svg>
            </div>
            <div className="title">RikTech <span className="small">AI</span></div>
          </div>

          <div className="dropdown">
            <button className="dropbtn" onClick={() => setShowMenu(!showMenu)}>
              <i className="fa fa-bars"></i>
            </button>
            {showMenu && (
              <div className="dropmenu">
                <button onClick={() => { setMessages([]); setShowMenu(false); }}>Percakapan Baru</button>
                <button onClick={() => { alert('History: ' + (messages.length) + ' pesan'); setShowMenu(false); }}>History</button>
                <button onClick={() => { alert('Settings belum tersedia'); setShowMenu(false); }}>Settings</button>
                <button onClick={() => { alert('RikTech AI\nVersion 1.0'); setShowMenu(false); }}>Info Aplikasi</button>
                <button onClick={() => { alert('Dikembangkan oleh: Rikdev Apps'); setShowMenu(false); }}>Info Pengembang</button>
              </div>
            )}
          </div>
        </header>

        <main className="main">
          <div className="chatbox">
            {messages.length === 0 && <div className="empty">Mulai percakapan dengan RikTech AI</div>}
            {messages.map((m, i) => (
              <div key={i} className={'msg ' + (m.from === 'user' ? 'user' : 'bot')}>
                <div className="bubble">{m.text}</div>
              </div>
            ))}
          </div>

          <form className="composer" onSubmit={sendMessage}>
            <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ketik pesan..." />
            <button type="submit"><i className="fa fa-paper-plane"></i></button>
            <button type="button" onClick={clearHistory} title="Hapus history"><i className="fa fa-trash"></i></button>
          </form>
        </main>

        <footer className="footer">
          <small>RikTech AI — offline-simple chatbot</small>
        </footer>
      </div>

      <style jsx>{`
        :global(body){ margin:0; font-family:Inter,Segoe UI,Arial; background:#f7f9fc; color:#111;}
        .splash{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:white;z-index:9999}
        .splash-card{display:flex;flex-direction:column;align-items:center;gap:10px;padding:30px;border-radius:18px;box-shadow:0 8px 30px rgba(20,30,60,0.08)}
        .splash-card svg{width:72px;height:72px}
        .app{max-width:900px;margin:24px auto;border-radius:18px;background:#fff;box-shadow:0 8px 30px rgba(10,20,40,0.06);overflow:hidden}
        .header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #f0f0f0}
        .brand{display:flex;align-items:center;gap:12px}
        .logo{width:44px;height:44px;border-radius:10px;background:#f3f6fb;display:flex;align-items:center;justify-content:center}
        .title{font-weight:700}
        .small{font-weight:500;color:#555}
        .dropdown{position:relative}
        .dropbtn{background:#fff;border:1px solid #eee;padding:8px;border-radius:10px;cursor:pointer}
        .dropmenu{position:absolute;right:0;top:48px;background:#fff;border-radius:12px;padding:8px;box-shadow:0 10px 30px rgba(10,20,40,0.06);display:flex;flex-direction:column;gap:6px}
        .dropmenu button{border:0;background:transparent;padding:8px 12px;border-radius:8px;text-align:left;cursor:pointer}
        .main{padding:18px;display:flex;flex-direction:column;gap:12px}
        .chatbox{min-height:360px;max-height:520px;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:10px}
        .msg{display:flex}
        .msg.user{justify-content:flex-end}
        .bubble{max-width:72%;padding:10px 12px;border-radius:12px;background:#f1f5f9}
        .msg.user .bubble{background:#dbeafe}
        .composer{display:flex;gap:8px;padding:12px;border-top:1px solid #f0f0f0}
        .composer input{flex:1;padding:10px;border-radius:12px;border:1px solid #e6eef8}
        .composer button{border:0;padding:10px;border-radius:10px;cursor:pointer;background:#fff}
        .footer{padding:10px;text-align:center;border-top:1px solid #f7f7f7}
        .empty{opacity:.6;text-align:center;padding:24px}
      `}</style>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    </>
  );
}

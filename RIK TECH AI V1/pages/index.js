import { useEffect, useState, useRef } from 'react'

export default function Home(){
  const [showMenu, setShowMenu] = useState(false)
  const [splash, setSplash] = useState(true)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [sessionId, setSessionId] = useState(localStorage.getItem('riktec_session') || '')
  const msgRef = useRef()

  useEffect(()=>{
    const raw = localStorage.getItem('riktec_history')
    if (raw) setMessages(JSON.parse(raw))
    // keep session id
    if (!sessionId) {
      const sid = localStorage.getItem('riktec_session') || ('sess-'+Date.now())
      setSessionId(sid)
      localStorage.setItem('riktec_session', sid)
    }
    const t = setTimeout(()=>setSplash(false),800)
    return ()=>clearTimeout(t)
  },[])

  useEffect(()=>{
    localStorage.setItem('riktec_history', JSON.stringify(messages))
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight
  },[messages])

  async function send(){
    if (!input.trim()) return
    const userMsg = { id: 'u-'+Date.now(), role:'user', text:input }
    setMessages(prev=>[...prev,userMsg])
    const payload = { message: input, sessionId }
    setInput('')

    try{
      const r = await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      const j = await r.json()
      const aiMsg = { id:j.id, role:'ai', text:j.reply }
      setMessages(prev=>[...prev,aiMsg])
      // store sessionId returned (server may create one)
      if (j.sessionId && j.sessionId !== sessionId) {
        setSessionId(j.sessionId)
        localStorage.setItem('riktec_session', j.sessionId)
      }
    }catch(err){
      setMessages(prev=>[...prev,{id:'err-'+Date.now(),role:'ai',text:'Gagal menghubungi API RikTech AI.'}])
    }
  }

  function newConversation(){
    setMessages([])
    localStorage.removeItem('riktec_history')
    setShowMenu(false)
  }
  function openHistory(){
    alert('History disimpan di storage lokal. Total percakapan: ' + messages.length)
    setShowMenu(false)
  }
  function openSettings(){
    alert('Pengaturan sederhana (placeholder).')
    setShowMenu(false)
  }
  function infoApp(){
    alert('RikTech AI — aplikasi lokal sederhana. Versi 1.1')
    setShowMenu(false)
  }
  function infoDev(){
    alert('Dikembangkan oleh RikTech. Kontak: (lokal)')
    setShowMenu(false)
  }

  async function exportHistory(){
    const dataStr = JSON.stringify({ sessionId, messages }, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `riktech_history_${sessionId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function fetchServerHistory(){
    if (!sessionId) return alert('No sessionId')
    try{
      const r = await fetch('/api/history?sessionId='+encodeURIComponent(sessionId))
      const j = await r.json()
      alert('Server runtime history items: ' + (j.history? j.history.length : 0) + '\n(Ini ephemeral — akan hilang jika fungsi di-restart)')
    }catch(e){
      alert('Gagal fetch history dari server runtime.')
    }
  }

  return (
    <div className="container">
      <header className="header card">
        <div className="logo-wrap">
          <div className="logo"><i className="fa-solid fa-robot"></i></div>
          <div>
            <div className="app-title">RikTech AI</div>
            <div style={{fontSize:12,color:'#6b7280'}}>Asisten lokal — tanpa integrasi eksternal</div>
          </div>
        </div>

        <div style={{marginLeft:'auto'}}>
          <div className="dropdown">
            <button className="menu-btn" onClick={()=>setShowMenu(v=>!v)} aria-label="Menu">
              <i className="fa-solid fa-bars" style={{fontSize:20}}></i>
            </button>
            <div className={"dropdown-content " + (showMenu? 'show':'') }>
              <div className="dropdown-item" onClick={newConversation}><i className="fa-regular fa-plus-square"></i> Percakapan baru</div>
              <div className="dropdown-item" onClick={openHistory}><i className="fa-regular fa-clock"></i> History</div>
              <div className="dropdown-item" onClick={openSettings}><i className="fa-solid fa-gear"></i> Settings</div>
              <div className="dropdown-item" onClick={infoApp}><i className="fa-solid fa-circle-info"></i> Info Aplikasi</div>
              <div className="dropdown-item" onClick={infoDev}><i className="fa-solid fa-user"></i> Info Pengembang</div>
            </div>
          </div>
        </div>
      </header>

      <main style={{marginTop:16}}>
        <div className="card splash" style={{padding:18}}>
          {splash ? (
            <>
              <div style={{fontSize:36}}><i className="fa-solid fa-rocket"></i></div>
              <h1>RikTech AI</h1>
              <div style={{opacity:0.7}}>Asisten lokal yang ringan dan mandiri</div>
            </>
          ) : (
            <div style={{width:'100%'}}>
              <div style={{display:'flex',gap:16}}>
                <div style={{flex:1}}>
                  <div className="card chat-box">
                    <div ref={msgRef} className="messages">
                      {messages.length===0 && <div style={{padding:16,color:'#64748b'}}>Belum ada percakapan. Klik menu → Percakapan baru untuk memulai, atau langsung ketik pesan di bawah.</div>}
                      {messages.map(m=> (
                        <div key={m.id} className={"message " + (m.role==='ai' ? 'ai' : 'user')}>
                          <div style={{fontSize:13,opacity:0.8}}>{m.role==='ai' ? 'RikTech AI' : 'Kamu'}</div>
                          <div style={{marginTop:6,whiteSpace:'pre-wrap'}}>{m.text}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,marginTop:8}}>
                      <div className="tools">
                        <button className="small-btn" onClick={()=>{ setInput('Buat contoh React kecil yang menampilkan daftar'); }}>Contoh kode</button>
                        <button className="small-btn" onClick={()=>{ setInput('Ringkas: Tuliskan teks yang ingin diringkas...'); }}>Ringkas</button>
                        <button className="small-btn" onClick={()=>{ setInput('Translate to Indonesian: Hello world'); }}>Terjemah</button>
                      </div>
                      <div>
                        <button className="small-btn" onClick={fetchServerHistory}>Cek Server History</button>
                        <button className="small-btn" onClick={exportHistory}>Export History</button>
                      </div>
                    </div>

                    <div className="input-row" style={{marginTop:8}}>
                      <input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Tulis pesan..." onKeyDown={(e)=>{if(e.key==='Enter') send()}} />
                      <button className="btn" onClick={send}><i className="fa-solid fa-paper-plane"></i></button>
                    </div>
                  </div>
                </div>

                <aside style={{width:260}}>
                  <div className="card">
                    <h3 style={{marginTop:0}}>Tentang</h3>
                    <p style={{marginTop:6,fontSize:14,color:'#475569'}}>RikTech AI berjalan sepenuhnya di API internal proyek ini. Tidak menggunakan layanan eksternal. Versi 1.1 menambah intent detection, contoh kode, ringkasan sederhana, dan export history.</p>
                    <div style={{marginTop:12}}>
                      <strong>Tip:</strong>
                      <ul style={{paddingLeft:18}}>
                        <li>Gunakan tombol cepat untuk memasukkan prompt.</li>
                        <li>Gunakan kata kunci: 'kode', 'ringkas', 'translate'.</li>
                        <li>Export history untuk backup lokal.</li>
                      </ul>
                    </div>
                  </div>
                </aside>
              </div>

              <div className="footer-note">RikTech AI • Versi 1.1 • Session: {sessionId}</div>
            </div>
          )}
        </div>
      </main>

    </div>
  )
}

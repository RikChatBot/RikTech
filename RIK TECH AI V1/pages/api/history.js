// Simple in-memory history viewer for the current runtime (ephemeral).
let sessionStore = global.__RIK_SESSION_STORE || (global.__RIK_SESSION_STORE = {})

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { sessionId } = req.query
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' })
    return res.status(200).json({ sessionId, history: sessionStore[sessionId] || [] })
  }
  return res.status(405).json({ error: 'Method not allowed' })
}

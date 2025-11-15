const { generateReply } = require('../utils/ai');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { sessionId, userId, message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message required' });
    const out = await generateReply({ sessionId, userId, message });
    return res.json({ replyId: Date.now().toString(36), text: out.text, confidence: out.confidence, sessionId: out.sessionId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server_error' });
  }
};

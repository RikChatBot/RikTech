const { readJSON, writeJSON } = require('../utils/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { sessionId, userId, userMessage, assistantReply, rating, tags } = req.body || {};
    if (!userMessage || !assistantReply) return res.status(400).json({ error: 'userMessage and assistantReply required' });
    const data = readJSON('training_examples.json', { examples: [] });
    data.examples.unshift({ id: Date.now().toString(36), sessionId, userId, userMessage, assistantReply, rating: rating || null, tags: tags || [], ts: Date.now() });
    if (data.examples.length > 5000) data.examples = data.examples.slice(0, 5000);
    writeJSON('training_examples.json', data);
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server_error' });
  }
};

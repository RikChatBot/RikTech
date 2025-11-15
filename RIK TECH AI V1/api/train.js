const { readJSON } = require('../utils/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const data = readJSON('training_examples.json', { examples: [] });
    return res.json({ count: data.examples.length, sample: data.examples.slice(0, 20) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server_error' });
  }
};

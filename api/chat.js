export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Simple AI response logic - bisa dikembangkan lebih lanjut
    const responses = {
      'hai': 'Halo! Saya RikTech AI, ada yang bisa saya bantu?',
      'halo': 'Halo! Senang bertemu dengan Anda!',
      'apa kabar': 'Saya baik-baik saja, terima kasih! Bagaimana dengan Anda?',
      'nama kamu': 'Saya adalah RikTech AI, asisten virtual yang siap membantu!',
      'terima kasih': 'Sama-sama! Senang bisa membantu Anda.',
      'default': `Saya menerima pesan Anda: "${message}". RikTech AI masih dalam pengembangan dan akan semakin pintar!`
    };

    const lowerMessage = message.toLowerCase();
    let response = responses.default;

    // Cari respons yang sesuai
    for (const [key, value] of Object.entries(responses)) {
      if (lowerMessage.includes(key) && key !== 'default') {
        response = value;
        break;
      }
    }

    // Simulasi delay processing
    await new Promise(resolve => setTimeout(resolve, 500));

    res.status(200).json({
      response: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

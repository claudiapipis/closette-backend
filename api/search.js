import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { textInput } = req.body;
    if (!textInput) {
      return res.status(400).json({ error: 'Provide textInput' });
    }

    // Simple search for now
    res.json({
      success: true,
      query: textInput,
      results: [
        { title: 'Test item', price: '£20', platform: 'Vinted', url: 'https://vinted.com' }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

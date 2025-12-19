export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;
    res.json({
      success: true,
      test: 'ebay',
      query: query || 'test',
      message: 'eBay endpoint working'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

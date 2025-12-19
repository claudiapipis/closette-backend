const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const EBAY_API_KEY = process.env.EBAY_API_KEY;

app.post('/api/search', async (req, res) => {
  try {
    const { textInput } = req.body;
    if (!textInput) {
      return res.status(400).json({ error: 'Provide textInput' });
    }

    // Search eBay only (simplest to test)
    const response = await axios.get('https://svcs.ebay.com/services/search/FindingService/v1', {
      params: {
        'SECURITY-APPNAME': EBAY_API_KEY,
        'OPERATION-NAME': 'findItemsByKeywords',
        'SERVICE-VERSION': '1.0.0',
        'GLOBAL-ID': 'EBAY-GB',
        'KEYWORDS': textInput,
        'SORTORDER': 'PricePlusShippingLowest',
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': 'true',
        'paginationInput.entriesPerPage': 5
      },
      timeout: 10000
    });

    const items = response.data?.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item || [];
    const results = items.slice(0, 5).map(item => ({
      title: item.title[0],
      price: item.sellingStatus[0].currentPrice[0].__value__ + ' GBP',
      image: item.galleryURL?.[0] || '',
      url: item.viewItemURL[0],
      platform: 'eBay'
    }));

    res.json({
      success: true,
      query: textInput,
      results: results,
      count: results.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

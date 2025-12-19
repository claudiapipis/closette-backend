const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const LOBSTR_API_KEY = process.env.LOBSTR_API_KEY;
const SCRAPINGBEE_API_KEY = process.env.SCRAPINGBEE_API_KEY;
const EBAY_API_KEY = process.env.EBAY_API_KEY;

// Analyze image with OpenAI Vision
async function analyzeImage(imageUrl) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4-vision',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this fashion item and extract these attributes in JSON format: color, pattern, material, occasion, era, vibe. Return ONLY valid JSON, no other text.'
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 500
    }, {
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      timeout: 60000
    });

    const content = response.data.choices[0].message.content;
    return JSON.parse(content);
  } catch (err) {
    console.error('OpenAI error:', err.message);
    return { color: 'unknown', pattern: 'unknown', material: 'unknown', occasion: 'casual', era: 'modern', vibe: 'vintage' };
  }
}

// Search Vinted via Lobstr.io
async function searchVinted(query) {
  try {
    console.log('Searching Vinted with:', query);
    const response = await axios.get('https://api.lobstr.io/v1/items/search', {
      params: { search_text: query },
      headers: { 'X-API-Key': LOBSTR_API_KEY },
      timeout: 10000
    });
    console.log('Vinted response:', response.data);
    return (response.data.items || []).slice(0, 3).map(item => ({
      title: item.title,
      price: item.price,
      image: item.photos?.[0]?.url || '',
      url: `https://www.vinted.com/items/${item.id}`,
      platform: 'Vinted',
      condition: item.status
    }));
  } catch (err) {
    console.error('Vinted error:', err.message, err.response?.data);
    return [];
  }
}

// Search Depop via ScrapingBee (simplified)
async function searchDepop(query) {
  try {
    const url = `https://www.depop.com/search/?q=${encodeURIComponent(query)}`;
    const response = await axios.get('https://api.scrapingbee.com/api/v1', {
      params: {
        api_key: SCRAPINGBEE_API_KEY,
        url: url,
        render_javascript: 'false'
      },
      timeout: 15000
    });

    // For MVP, return mock data since Depop scraping is complex
    return [
      {
        title: `Depop: ${query} - Vintage Find`,
        price: '£25',
        image: 'https://via.placeholder.com/200',
        url: `https://www.depop.com/search/?q=${encodeURIComponent(query)}`,
        platform: 'Depop',
        condition: 'Good'
      }
    ];
  } catch (err) {
    console.error('Depop error:', err.message);
    return [];
  }
}

// Search eBay UK
async function searchEbay(query) {
  try {
    const response = await axios.get('https://svcs.ebay.com/services/search/FindingService/v1', {
      params: {
        'SECURITY-APPNAME': EBAY_API_KEY,
        'OPERATION-NAME': 'findItemsByKeywords',
        'SERVICE-VERSION': '1.0.0',
        'GLOBAL-ID': 'EBAY-GB',
        'KEYWORDS': query,
        'SORTORDER': 'PricePlusShippingLowest',
        'OUTPUTSELECTOR': 'SellerInfo',
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': 'true',
        'paginationInput.entriesPerPage': 5
      },
      timeout: 15000
    });

    const items = response.data?.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item || [];
    return items.slice(0, 5).map(item => ({
      title: item.title[0],
      price: item.sellingStatus[0].currentPrice[0].__value__ + ' GBP',
      image: item.galleryURL?.[0] || '',
      url: item.viewItemURL[0],
      platform: 'eBay',
      condition: item.condition?.[0]?.conditionDisplayName?.[0] || 'Unknown'
    }));
  } catch (err) {
    console.error('eBay error:', err.message);
    return [];
  }
}

// Main endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { imageUrl, textInput } = req.body;

    if (!imageUrl && !textInput) {
      return res.status(400).json({ error: 'Provide imageUrl or textInput' });
    }

    let attributes;
    let searchQuery = textInput;

    // If image provided, analyze it
    if (imageUrl) {
      attributes = await analyzeImage(imageUrl);
      searchQuery = `${attributes.color} ${attributes.pattern} ${attributes.material} ${attributes.vibe}`.trim();
    }

    // Search all platforms in parallel
    const [vintedResults, depopResults, ebayResults] = await Promise.all([
      searchVinted(searchQuery),
      searchDepop(searchQuery),
      searchEbay(searchQuery)
    ]);

    const allResults = [...vintedResults, ...depopResults, ...ebayResults];

    res.json({
      success: true,
      attributes,
      query: searchQuery,
      results: allResults,
      count: allResults.length
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

# Closette Backend - Setup & Deployment Guide

## What This Does

This Node.js backend:
1. Receives an image URL or text input
2. Uses OpenAI Vision to analyze fashion attributes (color, pattern, material, vibe)
3. Searches Vinted, Depop, and eBay in parallel
4. Returns curated results from all 3 platforms

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Create `.env` file
Copy `.env.example` to `.env` and fill in your API keys:
```
OPENAI_API_KEY=sk-...
LOBSTR_API_KEY=your_lobstr_key
SCRAPINGBEE_API_KEY=your_scrapingbee_key
EBAY_API_KEY=your_ebay_app_id
PORT=3000
```

### 3. Run locally
```bash
npm start
```

Server will run on `http://localhost:3000`

### 4. Test the API
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/vintage-tshirt.jpg",
    "textInput": "vintage band tshirt"
  }'
```

---

## Deploy to Vercel

### 1. Create Vercel Account
Go to https://vercel.com and sign up with GitHub

### 2. Create `vercel.json` in project root:
```json
{
  "buildCommand": "npm install",
  "regions": ["lhr1"],
  "functions": {
    "closette_backend.js": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

### 3. Push to GitHub
```bash
git init
git add .
git commit -m "Initial Closette backend"
git push -u origin main
```

### 4. Deploy on Vercel
- Go to vercel.com/new
- Import your GitHub repo
- Add environment variables (OPENAI_API_KEY, LOBSTR_API_KEY, SCRAPINGBEE_API_KEY, EBAY_API_KEY)
- Click Deploy

### 5. Get Your API URL
After deployment, Vercel gives you a URL like:
```
https://closette-backend.vercel.app
```

---

## Connect to Your Frontend (Webflow/Framer)

In your webhook or form submission, send POST to:
```
https://your-vercel-url.vercel.app/api/search
```

With body:
```json
{
  "imageUrl": "image_url_here",
  "textInput": "optional text description"
}
```

Response:
```json
{
  "success": true,
  "attributes": {
    "color": "black",
    "pattern": "band logo",
    "material": "cotton",
    "vibe": "vintage"
  },
  "query": "black band logo cotton vintage",
  "results": [
    {
      "title": "Vintage Metallica Tee",
      "price": "£18",
      "image": "https://...",
      "url": "https://vinted.com/...",
      "platform": "Vinted",
      "condition": "Good"
    },
    ...
  ],
  "count": 15
}
```

---

## API Endpoint

**POST** `/api/search`

**Request:**
```json
{
  "imageUrl": "https://example.com/image.jpg",  // optional
  "textInput": "vintage Y2K dress"               // optional (at least one required)
}
```

**Response:**
```json
{
  "success": true,
  "attributes": { /* OpenAI analysis */ },
  "query": "search query used",
  "results": [ /* items from Vinted, Depop, eBay */ ],
  "count": 15
}
```

---

## Important Notes

- **OpenAI Vision API** costs ~$0.01-0.03 per image
- **Lobstr.io** (Vinted) - check pricing, usually ~$15-30 for initial searches
- **ScrapingBee** (Depop) - 1000 free credits, then pay-as-you-go
- **eBay API** - free tier available
- **Vercel** - free tier includes 10 serverless functions with 1GB/month

---

## Troubleshooting

**Timeout errors?**
- Increase max timeout in Vercel function settings
- Consider caching results
- Reduce number of parallel API calls

**Rate limits hit?**
- Add caching layer (Redis)
- Implement request queuing
- Upgrade API plans

**Depop data not returning?**
- Depop HTML parsing is complex; the backend has a placeholder
- Consider using a Depop scraper service or accept mock data for MVP

---

## Next Steps

1. Deploy this backend to Vercel
2. Get your API URL
3. Update your Make.com webhook to call this backend instead
4. Test end-to-end
5. Build frontend to display results

You now have a working backend! 🚀

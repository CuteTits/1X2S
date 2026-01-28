# Dynamic Carousel Setup Guide

## Overview
Your carousel now loads data dynamically from a JSON API endpoint. The data is fetched from the backend and rendered in real-time.

## What Changed

### 1. Backend (index.js)
Added new API endpoint:
```
GET /api/carousel/insights
```

Returns JSON in format:
```json
{
  "success": true,
  "data": [
    {
      "id": 0,
      "title": "Week Label",
      "header": "Main Title",
      "subheader": "Subtitle",
      "items": [
        { "title": "Item Title", "description": "Item Description" }
      ]
    }
  ]
}
```

### 2. Frontend (public/insights/index.html)
- Removed static placeholder cards
- Added `loadCarouselData()` function that:
  - Fetches data from `/api/carousel/insights`
  - Renders cards dynamically
  - Handles errors gracefully
  - Initializes interactions

## Customization Options

### Option 1: Modify API Response (Recommended for Free Hosting)
Edit the carousel data directly in `index.js` around line 360. Change the `carouselData` object to add/modify cards:

```javascript
const carouselData = [
  {
    id: 0,
    title: "Your Week Label",
    header: "Your Main Title",
    subheader: "Your Subtitle",
    items: [
      { title: "Item 1", description: "Description 1" },
      { title: "Item 2", description: "Description 2" }
    ]
  }
];
```

### Option 2: Load from Database (If Using MySQL)
Replace the carousel data with a database query:

```javascript
app.get('/api/carousel/insights', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM carousel_insights ORDER BY id');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
```

### Option 3: Load from External API
Fetch data from another free API or service:

```javascript
app.get('/api/carousel/insights', async (req, res) => {
  try {
    const response = await fetch('https://external-api.com/insights');
    const data = await response.json();
    res.json({ success: true, data: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
```

## Free Hosting Compatible Options

This setup works with free services:

### ✅ Render.com
- Free tier available
- Node.js compatible
- No additional setup needed

### ✅ Railway.app
- Free tier with $5/month credit
- Good for light projects

### ✅ Heroku (Alternative)
- No longer free, but setup similar

### ✅ Local/Self-hosted
- Deploy on your own server

## Data Structure

Each carousel card object should include:
```javascript
{
  id: number,              // Unique identifier
  title: string,           // Button label
  header: string,          // Main heading
  subheader: string,       // Secondary heading
  items: Array [           // Optional: array of items
    {
      title: string,
      description: string
    }
  ]
}
```

## Testing Locally

1. Make sure your server is running:
   ```bash
   node index.js
   ```

2. Visit: `http://localhost:3000/public/insights/`

3. Open browser DevTools Console to see:
   - Loading messages
   - API response data
   - Any errors

4. Test the API directly:
   ```bash
   curl http://localhost:3000/api/carousel/insights
   ```

## Error Handling

If the API fails to load, users see a fallback error message instead of a broken page. Check console logs for details.

## Performance & Caching

For production with Render.com:
- Free tier is suitable for light traffic
- Consider adding caching headers for static data:
  ```javascript
  app.get('/api/carousel/insights', (req, res) => {
    res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
    // ... rest of endpoint
  });
  ```

## Next Steps

1. Customize the `carouselData` in `index.js` with your actual data
2. Test locally
3. Deploy to your hosting service
4. Monitor API responses in production

## FAQ

**Q: How do I add more cards?**
A: Add more objects to the `carouselData` array in the API endpoint.

**Q: Can I animate the cards differently?**
A: Yes, modify the CSS in `/assets/css/pages/page-insights.css` and the HTML structure in the `renderCarouselCards()` function.

**Q: Is this compatible with my existing Render deployment?**
A: Yes! Just update your `index.js` file and redeploy.

**Q: Can I fetch data from Google Gemini AI?**
A: Yes, integrate Gemini API calls in the endpoint to generate insights dynamically.


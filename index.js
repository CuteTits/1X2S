import express from 'express';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Blocked countries (ISO codes)
const blockedCountries = ['CN', 'RU', 'NG', 'SE'];

// Middleware to parse JSON
app.use(express.json());

// Middleware to detect country via Cloudflare
app.use((req, res, next) => {
  const userCountry = req.headers['cf-ipcountry'] || 'Unknown';
  req.country = userCountry;
  next();
});

// ✅ Serve CSS with no-cache headers
app.use('/pagecontent/stylesheets', express.static(path.join(__dirname, 'public', 'pagecontent', 'stylesheets'), {
  etag: false, 
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// ✅ Serve all other static files normally
app.use(express.static(path.join(__dirname, 'public')));

// Serve navbar.html
app.get('/navbar.html', (req, res) => {
  fs.readFile(path.join(__dirname, 'public', 'navbar.html'), 'utf-8', (err, data) => {
    if (err) return res.status(500).send('Error reading navbar file');
    res.send(data);
  });
});

// Signup page route
app.get('/signup/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup', 'index.html'), (err) => {
    if (err) res.status(500).send('Error loading signup page');
  });
});

// Endpoint to send country info to client-side
app.get('/signup-country', (req, res) => {
  const isBlocked = blockedCountries.includes(req.country);
  res.json({ country: req.country, blocked: isBlocked });
});

// Chatbot endpoint
app.post('/chat', async (req, res, next) => {
  try {
    const { message } = req.body;

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral',
        prompt: message,
        stream: false
      })
    });

    const data = await response.json();
    console.log('Ollama API returned:', data);

    res.json({ reply: data.response });
  } catch (err) {
    console.error('Error contacting Mistral:', err);
    next(err);
  }
});

//
// --- ERROR HANDLING ---
//

// 404 handler (must be after all routes)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// General error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, 'public', '500.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

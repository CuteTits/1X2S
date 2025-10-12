import express from 'express';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import session from 'express-session';
import { GoogleGenerativeAI } from "@google/generative-ai"; // Import Gemini API



// Load environment variables from .env file
dotenv.config();
console.log("Gemini API Key:", process.env.GEMINI_API_KEY);

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// --- MySQL Connection (Aiven) ---
let db;

async function initDB() {
  try {
    db = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      ssl: {
      ca: fs.readFileSync(process.env.DB_SSL_CA || '/etc/secrets/ca.pem')
     },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const [rows] = await db.query('SELECT NOW() AS now');
    console.log('✅ Connected to Aiven MySQL at', rows[0].now);
  } catch (err) {
    console.error('❌ MySQL connection failed:', err);
    process.exit(1); // stop if DB fails
  }
}

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
app.use(
  '/pagecontent/stylesheets',
  express.static(path.join(__dirname, 'public', 'pagecontent', 'stylesheets'), {
    etag: false,
    maxAge: 0,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  })
);

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

// --- Example API Routes with MySQL ---

// Test DB connection
app.get('/db-test', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT NOW() AS now');
    res.json({ success: true, serverTime: rows[0].now });
  } catch (err) {
    console.error('DB test failed:', err);
    res.status(500).json({ success: false, error: 'Database query failed' });
  }
});

// Example signup endpoint (store email + password)
// Signup endpoint (store name, email + hashed password)

// --- session endpoint ---
app.use(session({
  name: 'sid', // 👈 shorter cookie name
  secret: process.env.SESSION_SECRET || 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false, maxAge: 1000 * 60 * 60 }
}));

// --- Session status ---
app.get('/api/session', (req, res) => {
  if (req.session && req.session.user) {
    res.json({
      loggedIn: true,
      user: {
        id: req.session.user.id,
        name: req.session.user.name,
        email: req.session.user.email
      }
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// --- Signup endpoint ---
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  try {
    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert into DB
    await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    res.json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    console.error('Signup error:', err);

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    res.status(500).json({ success: false, message: 'Database insert failed' });
  }
});

// --- Login endpoint ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Missing credentials' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // ✅ Store minimal user info in session, including user_uid
    req.session.user = { 
      id: user.id,         // optional, your internal auto-increment ID
      user_uid: user.user_uid,  // this is what you want to display
      name: user.name, 
      email: user.email 
    };

    res.json({ success: true, message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Return account info
app.get('/api/account', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  console.log("🔍 Session user:", req.session.user);

  try {
    const [rows] = await db.query(
      'SELECT user_uid, name, email FROM users WHERE user_uid = ?',
      [req.session.user.user_uid]
    );

    console.log("✅ DB result:", rows);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];

    res.json({
      name: user.name,
      email: user.email,
      user_uid: user.user_uid
    });

  } catch (err) {
    console.error("❌ SQL Error:", err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Logout (destroy session)
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('sid');
    res.json({ success: true });    
  });
});

// Change password endpoint
app.post('/api/change-password', async (req, res) => {
  // 1️⃣ Make sure user is logged in
  if (!req.session.user) {
    return res.status(401).json({ success: false, error: 'Not logged in' });
  }

  const { oldPassword, newPassword, confirmPassword } = req.body;

  // 2️⃣ Validate inputs
  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, error: 'New passwords do not match' });
  }

  try {
    // 3️⃣ Fetch current password from DB
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.session.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = rows[0];

    // 4️⃣ Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    // 5️⃣ Hash new password
    const hashedNew = await bcrypt.hash(newPassword, 10);

    // 6️⃣ Update DB
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNew, req.session.user.id]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete account (requires password)
app.delete('/api/delete-account', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  try {
    // Fetch the user’s stored password hash
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.session.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // ✅ Password correct → delete account
    await db.query('DELETE FROM users WHERE id = ?', [req.session.user.id]);

    // Destroy session
    req.session.destroy(() => {
      res.clearCookie('sid');
      res.json({ success: true, message: 'Account deleted successfully' });
    });

  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// --- Google API (Gemini 2.5 Flash) ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Access the API key from .env
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


app.post("/api/gemini", async (req, res) => {
    const prompt = req.body.prompt; // Get the prompt from the request body
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }
    try {
        const geminiResponse = await model.generateContent(prompt);
        const text = geminiResponse.response.text();
        res.json({ response: text }); // Send the response back to the frontend
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        res.status(500).json({ error: "Error getting response from Gemini API" }); // Handle errors
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
(async () => {
  await initDB();

  app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
  });
})();
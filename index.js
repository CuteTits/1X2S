import express from 'express';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import session from 'express-session';



// Load environment variables from .env file
dotenv.config();

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
      ca: fs.readFileSync(process.env.DB_SSL_CA)
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

    // ✅ Store minimal user info in session
    req.session.user = { id: user.id, name: user.name, email: user.email };

    res.json({ success: true, message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

  

// Return account info
app.get('/api/account', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  res.json({
    name: req.session.user.name,
    email: req.session.user.email
  });
});

// Logout (destroy session)
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('sid');
    res.json({ success: true });
    
  });
});

// Delete account
app.delete('/api/delete-account', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  await db.query('DELETE FROM users WHERE id = ?', [req.session.user.id]);
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
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

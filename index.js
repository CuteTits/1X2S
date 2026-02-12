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
    
    // Run migrations
    await runMigrations();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err);
    process.exit(1); // stop if DB fails
  }
}

// Migration function to add new columns if they don't exist
async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Create competitions table if it doesn't exist
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS competitions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          icon VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Competitions table created/verified');
    } catch (err) {
      console.log('ℹ️  Competitions table already exists');
    }
    
    // Add new columns to carousel_insights if they don't exist (one at a time)
    const columns = [
      { name: 'date', def: 'DATE' },
      { name: 'subtitle', def: 'VARCHAR(255)' },
      { name: 'description', def: 'TEXT' },
      { name: 'dropdowns', def: 'JSON' },
      { name: 'location', def: 'VARCHAR(255)' },
      { name: 'gmt_time', def: 'TIME' },
      { name: 'competition_id', def: 'INT' },
      { name: 'link', def: 'VARCHAR(500)' }
    ];
    
    for (const col of columns) {
      try {
        await db.query(`ALTER TABLE carousel_insights ADD COLUMN ${col.name} ${col.def}`);
        console.log(`✅ Added column: ${col.name}`);
      } catch (err) {
        if (err.message.includes('Duplicate column')) {
          console.log(`ℹ️  Column ${col.name} already exists`);
        } else {
          throw err;
        }
      }
    }
    
    console.log('✅ Carousel columns migration completed');
  } catch (err) {
    console.warn('⚠️  Migration warning:', err.message);
  }
}

// Blocked countries (ISO codes)
const blockedCountries = ['CN', 'RU', 'NG', 'SE'];

// Middleware to parse JSON
app.use(express.json());

// Middleware to set country (Cloudflare detection disabled)
app.use((req, res, next) => {
  req.country = 'Unknown';
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
  cookie: { httpOnly: true, secure: false }
}));

// --- Session status ---
app.get('/api/session', (req, res) => {
  if (req.session && req.session.user) {
    res.json({
      loggedIn: true,
      user: {
        id: req.session.user.id,
        name: req.session.user.name,
        email: req.session.user.email,
        role: req.session.user.role || 'user'
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

  // Cloudflare Turnstile verification disabled

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

    // ✅ Store user info in session, including role for authorization
    req.session.user = { 
      id: user.id,
      user_uid: user.user_uid,
      name: user.name, 
      email: user.email,
      role: user.role || 'user'  // Default to 'user' if role not set
    };

    res.json({ success: true, message: 'Login successful', role: user.role });
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

// ========== ADMIN AUTHENTICATION MIDDLEWARE ==========
// Protect admin endpoints - only logged-in users can access
const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  next();
};

// ========== ADMIN ROLE MIDDLEWARE ==========
// Stricter: only users with 'admin' role can access
const requireAdminRole = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  
  next();
};

// ========== COMPETITIONS API ENDPOINTS ==========
// Get all competitions
app.get('/api/competitions', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, icon FROM competitions ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching competitions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new competition (PROTECTED - ADMIN ONLY)
app.post('/api/competitions', requireAdminRole, async (req, res) => {
  const { name, icon } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, error: 'Competition name is required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO competitions (name, icon) VALUES (?, ?)',
      [name, icon || null]
    );
    
    res.json({ success: true, message: 'Competition created', id: result.insertId });
  } catch (err) {
    if (err.message.includes('Duplicate entry')) {
      return res.status(400).json({ success: false, error: 'Competition already exists' });
    }
    console.error('Error creating competition:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete competition (PROTECTED - ADMIN ONLY)
app.delete('/api/competitions/:id', requireAdminRole, async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM competitions WHERE id = ?', [id]);
    res.json({ success: true, message: 'Competition deleted' });
  } catch (err) {
    console.error('Error deleting competition:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========== CAROUSEL API ENDPOINT ==========
app.get('/api/carousel/insights', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM carousel_insights ORDER BY id'
    );
    
    // Parse JSON fields and provide defaults
    const data = await Promise.all(rows.map(async (row) => {
      let parsedData = {
        id: row.id,
        title: row.title,
        date: row.date || null,
        subtitle: row.subtitle || row.header || '',
        description: row.description || row.subheader || '',
        parents: [],
        dropdowns: [] // Fallback for old data
      };

      // Try to parse dropdowns (now contains parents or flat dropdowns)
      if (row.dropdowns) {
        try {
          let parsed;
          if (typeof row.dropdowns === 'string') {
            parsed = JSON.parse(row.dropdowns);
          } else {
            parsed = row.dropdowns;
          }
          
          // Check if it's the new hierarchical structure (parents)
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title !== undefined && parsed[0].dropdowns !== undefined) {
            // New structure: array of parent objects
            parsedData.parents = parsed;
            
            // Enhance each dropdown in each parent with competition details
            for (let parent of parsedData.parents) {
              if (parent.dropdowns && Array.isArray(parent.dropdowns)) {
                for (let dropdown of parent.dropdowns) {
                  if (dropdown.competition_id) {
                    try {
                      const [compRows] = await db.query(
                        'SELECT id, name, icon FROM competitions WHERE id = ?',
                        [dropdown.competition_id]
                      );
                      if (compRows.length > 0) {
                        dropdown.competition_name = compRows[0].name;
                        dropdown.competition_icon = compRows[0].icon;
                      }
                    } catch (err) {
                      console.warn('Failed to fetch competition for dropdown');
                    }
                  }
                }
              }
            }
          } else {
            // Old structure: flat dropdowns array - convert to new structure
            parsedData.dropdowns = parsed;
            
            // Enhance each dropdown with competition details
            for (let dropdown of parsedData.dropdowns) {
              if (dropdown.competition_id) {
                try {
                  const [compRows] = await db.query(
                    'SELECT id, name, icon FROM competitions WHERE id = ?',
                    [dropdown.competition_id]
                  );
                  if (compRows.length > 0) {
                    dropdown.competition_name = compRows[0].name;
                    dropdown.competition_icon = compRows[0].icon;
                  }
                } catch (err) {
                  console.warn('Failed to fetch competition for dropdown');
                }
              }
            }
          }
        } catch (e) {
          console.warn('Failed to parse dropdowns for card', row.id);
          parsedData.parents = [];
          parsedData.dropdowns = [];
        }
      }

      return parsedData;
    }));
    
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching carousel data:', err);
    // If the columns don't exist, return empty array
    if (err.message && err.message.includes('Unknown column')) {
      res.json({ success: true, data: [] });
    } else {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// ========== CAROUSEL MANAGEMENT ENDPOINTS ==========

// ========== CAROUSEL MANAGEMENT ENDPOINTS ==========

// Create a new carousel card (PROTECTED - ADMIN ONLY)
app.post('/api/carousel/insights', requireAdminRole, async (req, res) => {
  const { title, date, subtitle, description, parents } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: 'Title is required' });
  }

  try {
    const parentsJSON = parents ? JSON.stringify(parents) : null;
    const [result] = await db.query(
      'INSERT INTO carousel_insights (title, date, subtitle, description, dropdowns) VALUES (?, ?, ?, ?, ?)',
      [title, date || null, subtitle || '', description || '', parentsJSON]
    );
    
    res.json({ success: true, message: 'Card created', id: result.insertId });
  } catch (err) {
    console.error('Error creating carousel card:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update carousel card (PROTECTED - ADMIN ONLY)
app.put('/api/carousel/insights/:id', requireAdminRole, async (req, res) => {
  const { id } = req.params;
  const { title, date, subtitle, description, parents } = req.body;

  try {
    const parentsJSON = parents ? JSON.stringify(parents) : null;
    await db.query(
      'UPDATE carousel_insights SET title = ?, date = ?, subtitle = ?, description = ?, dropdowns = ? WHERE id = ?',
      [title, date || null, subtitle || '', description || '', parentsJSON, id]
    );
    
    res.json({ success: true, message: 'Card updated' });
  } catch (err) {
    console.error('Error updating carousel card:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete carousel card (PROTECTED - ADMIN ONLY)
app.delete('/api/carousel/insights/:id', requireAdminRole, async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM carousel_insights WHERE id = ?', [id]);
    res.json({ success: true, message: 'Card deleted' });
  } catch (err) {
    console.error('Error deleting carousel card:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========== USER MANAGEMENT API ENDPOINTS ==========

// Get all users (PROTECTED - ADMIN ONLY)
app.get('/api/admin/users', requireAdminRole, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, user_uid, name, email, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create a new user (PROTECTED - ADMIN ONLY)
app.post('/api/admin/users', requireAdminRole, async (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
  }

  // Only allow role to be 'admin' or 'user'
  const userRole = (role === 'admin') ? 'admin' : 'user';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate random user_uid
    const user_uid = Math.random().toString(36).substr(2, 12);
    
    const [result] = await db.query(
      'INSERT INTO users (user_uid, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [user_uid, name, email, hashedPassword, userRole]
    );
    
    res.json({ success: true, message: 'User created', id: result.insertId });
  } catch (err) {
    console.error('Error creating user:', err);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }
    
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update a user (PROTECTED - ADMIN ONLY)
app.put('/api/admin/users/:id', requireAdminRole, async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required' });
  }

  // Only allow role to be 'admin' or 'user'
  const userRole = (role === 'admin') ? 'admin' : 'user';

  try {
    if (password) {
      // Update with new password and role
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?',
        [name, email, hashedPassword, userRole, id]
      );
    } else {
      // Update without changing password but allow role change
      await db.query(
        'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
        [name, email, userRole, id]
      );
    }
    
    res.json({ success: true, message: 'User updated' });
  } catch (err) {
    console.error('Error updating user:', err);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }
    
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a user (PROTECTED - ADMIN ONLY)
app.delete('/api/admin/users/:id', requireAdminRole, async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

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
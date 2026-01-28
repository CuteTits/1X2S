# Security Best Practices for Your Application

## ✅ What's Been Implemented

### 1. **Authentication on Admin Endpoints**
- All admin endpoints (`/api/admin/users`, `/api/carousel/insights` POST/PUT/DELETE) now require user login
- Middleware checks session before allowing modifications
- Response: `401 Unauthorized` if not logged in
- Admin panel redirects to login if authentication fails

### 2. **Password Security**
- Passwords hashed with bcrypt (10 salt rounds)
- Never stored or transmitted in plain text
- Password reset requires admin creation of new user
- Session-based authentication (cookie-based)

### 3. **Database Security**
- **SQL Injection Prevention**: All queries use parameterized statements (`?` placeholders)
  - Example: `db.query('SELECT * FROM users WHERE id = ?', [id])`
  - Prevents malicious SQL injection attacks
- **Duplicate Email Detection**: Unique constraint on email field prevents duplicates
- **Environment Variables**: Database credentials in `.env` file (excluded from git)

### 4. **Session Management**
- Sessions stored in Express (resettable on server restart)
- HTTP-only cookies prevent XSS attacks
- Session timeout: 1 hour of inactivity
- Secure flag ready for HTTPS in production

---

## 🚀 Additional Security Recommendations

### For Production (Render.com Deployment)

**1. Enable HTTPS**
```javascript
// In index.js, add for Render.com:
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.hostname}${req.originalUrl}`);
    }
    next();
  });
}
```

**2. Add Rate Limiting** (prevent brute force attacks)
```bash
npm install express-rate-limit
```
```javascript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 attempts per 15 mins
});

app.post('/api/login', loginLimiter, async (req, res) => {
  // ... login logic
});

const apiLimiter = rateLimit({
  windowMs: 1000, // per second
  max: 30 // 30 requests per second
});

app.use('/api/', apiLimiter);
```

**3. Add CSRF Protection** (cross-site request forgery)
```bash
npm install csurf
```
```javascript
import csrf from 'csurf';
const csrfProtection = csrf({ cookie: false });

app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

**4. Input Validation**
```javascript
// Install validator
npm install validator

// In routes:
import validator from 'validator';

app.post('/api/admin/users', requireAdmin, async (req, res) => {
  const { name, email, password } = req.body;
  
  // Validate inputs
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  if (!validator.isLength(password, { min: 8 })) {
    return res.status(400).json({ error: 'Password must be 8+ characters' });
  }
  
  if (!validator.isLength(name, { min: 2, max: 100 })) {
    return res.status(400).json({ error: 'Name must be 2-100 characters' });
  }
  
  // ... rest of logic
});
```

**5. Content Security Policy (CSP)**
```javascript
import helmet from 'helmet';

app.use(helmet());

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
  }
}));
```

**6. Hide Server Information**
```javascript
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.removeHeader('Server');
  next();
});
```

**7. Session Store for Production** (instead of in-memory)
```bash
npm install connect-mongo  # if using MongoDB
# or
npm install connect-mysql2  # for MySQL
```
```javascript
import MySQLStore from 'connect-mysql2/session';

app.use(session({
  store: new MySQLStore({}, connection),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: true, sameSite: 'strict' }
}));
```

---

## 📋 .gitignore Setup

Ensure your `.gitignore` includes:
```
.env
.env.local
node_modules/
npm-debug.log
.DS_Store
*.log
build/
dist/
```

**DO NOT commit:**
- Database credentials (in `.env`)
- API keys
- Private keys
- Passwords
- Session secrets

---

## 🔍 Security Checklist

- [x] Authentication on admin endpoints
- [x] Password hashing (bcrypt)
- [x] SQL injection prevention (parameterized queries)
- [x] Session management with HTTP-only cookies
- [x] Environment variables for secrets
- [ ] HTTPS in production
- [ ] Rate limiting on auth endpoints
- [ ] CSRF protection
- [ ] Input validation
- [ ] Content Security Policy headers
- [ ] Production session store (not in-memory)
- [ ] Regular security updates to dependencies

---

## 🐛 Debugging Security

If you get `401 Unauthorized`:
1. Check if you're logged in: Visit `/api/session`
2. Verify session cookie is set in browser DevTools → Application → Cookies
3. Ensure login endpoint works: Test `/api/login` with valid credentials

---

## 📞 Questions?
- Test your endpoints with tools like Postman or curl
- Check browser console for errors
- Check server logs (terminal output)
- Verify `.env` file exists with correct database credentials

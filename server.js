import express from 'express';
import mysql from 'mysql2/promise';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import expressSession from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
dotenv.config();

const app = express();

// Update CORS origin to your deployed frontend domain
app.use(cors({
  origin: process.env.FRONTEND_URL, // e.g. 'https://segnovivo-h0gy.onrender.com'
  credentials: true
}));

app.use(bodyParser.json());

console.log('Environment variables check:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'NOT SET');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'NOT SET');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'segno_vivo',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255),
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255),
        google_id VARCHAR(255),
        google_name VARCHAR(255),
        google_picture VARCHAR(500),
        auth_provider ENUM('local', 'google') DEFAULT 'local',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_banned BOOLEAN DEFAULT FALSE
      )
    `);
    console.log('Users table created/verified successfully');
    connection.release();
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

initializeDatabase();

app.use(expressSession({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log('Deserializing user ID:', id);
    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [id]);
    connection.release();
    
    if (users.length > 0) {
      console.log('User found during deserialization:', users[0].email);
      done(null, users);
    } else {
      console.log('No user found during deserialization');
      done(null, false);
    }
  } catch (error) {
    console.error('Deserialization error:', error);
    done(error, null);
  }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/auth/google/callback` // Use your deployed backend URL here
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const connection = await pool.getConnection();

      const googleEmail = profile.emails[0].value;
      const googleId = profile.id;
      const googleName = profile.displayName;
      const googlePicture = profile.photos?.value;

      let [existingUsers] = await connection.query(
        'SELECT * FROM users WHERE email = ? OR google_id = ?',
        [googleEmail, googleId]
      );

      let user;

      if (existingUsers.length > 0) {
        user = existingUsers[0];

        if (user.is_banned) {
          connection.release();
          return done(null, false, { message: 'Your account has been banned.' });
        }

        if (!user.google_id) {
          await connection.query(
            'UPDATE users SET username = ?, google_id = ?, google_name = ?, google_picture = ?, auth_provider = ? WHERE id = ?',
            [googleName, googleId, googleName, googlePicture, 'google', user.id]
          );
          user.username = googleName;
          user.google_id = googleId;
          user.google_name = googleName;
          user.google_picture = googlePicture;
          user.auth_provider = 'google';
        }
      } else {
        let [bannedUsers] = await connection.query(
          'SELECT * FROM users WHERE email = ? AND is_banned = TRUE',
          [googleEmail]
        );
        if (bannedUsers.length > 0) {
          connection.release();
          return done(null, false, { message: 'Your account has been banned.' });
        }

        const [result] = await connection.query(
          'INSERT INTO users (username, email, google_id, google_name, google_picture, auth_provider) VALUES (?, ?, ?, ?, ?, ?)',
          [googleName, googleEmail, googleId, googleName, googlePicture, 'google']
        );

        [existingUsers] = await connection.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
        user = existingUsers[0];
      }

      connection.release();
      return done(null, user);

    } catch (error) {
      console.error('Google auth error:', error);
      return done(error, null);
    }
  }
));

app.get('/test-db', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM users');
    connection.release();
    res.json({ message: 'Database connection successful', userCount: rows[0].count });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO users (username, email, password, auth_provider) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'local']
    );
    connection.release();
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
});

app.post('/api/login', async (req, res) => {
  console.log('Login attempt received:', req.body);
  try {
    const { username, password } = req.body;
    console.log('Extracted credentials - Username:', username, 'Password length:', password?.length);

    if (!username || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ error: 'Username and password are required' });
    }

    console.log('Querying database for user...');
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? AND auth_provider = ?', 
      [username, 'local']
    );
    console.log('Database query result - Found users:', users.length);
    
    if (users.length === 0) {
      console.log('No user found with username:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    console.log('Found user:', { id: user.id, username: user.username, email: user.email, auth_provider: user.auth_provider });

    if (user.is_banned) {
      console.log('User is banned');
      return res.status(403).json({ error: 'Your account has been banned.' });
    }
    
    console.log('Comparing passwords...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    
    const token = jwt.sign(
      { id: user.id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );
    console.log('JWT token generated successfully');
    
    console.log('Sending successful response');
    return res.json({
      success: true,
      user: userWithoutPassword,
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/auth/google',
  (req, res, next) => {
    console.log('Google OAuth initiated');
    next();
  },
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  (req, res, next) => {
    console.log('Google OAuth callback received');
    next();
  },
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    console.log('Google OAuth successful, user:', req.user);
    const { password, ...userWithoutPassword } = req.user;
    
    res.redirect(`${process.env.FRONTEND_URL}/?token=${jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '1h' })}&user=${encodeURIComponent(JSON.stringify(userWithoutPassword))}`);
  }
);

app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    res.redirect(`${process.env.FRONTEND_URL}/login`);
  });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Google OAuth endpoints:');
  console.log(`- Initiate: ${process.env.BACKEND_URL}/auth/google`);
  console.log(`- Callback: ${process.env.BACKEND_URL}/auth/google/callback`);
  console.log(`- Test DB: ${process.env.BACKEND_URL}/test-db`);
});

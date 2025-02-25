require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const authRoutes = require('./routes/auth');
const spotifyRoutes = require('./routes/spotify');
const recommendationRoutes = require('./routes/recommendations');

const app = express();
const PORT = process.env.PORT || 3000;

// Make sure the data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Initialize the database
const dbPath = process.env.DB_PATH;
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    // Initialize database tables
    initializeDatabase(db);
  }
});

// Make db available to routes
app.locals.db = db;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: './data'
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/auth', authRoutes);
app.use('/spotify', spotifyRoutes);
app.use('/recommendations', recommendationRoutes);

// Home route
app.get('/', (req, res) => {
  res.render('index', { 
    isLoggedIn: req.session.spotifyAccessToken ? true : false 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Something went wrong!' });
});

// Function to initialize database tables
function initializeDatabase(db) {
  // Create feedback table
  db.run(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      recommendationId TEXT NOT NULL,
      itemType TEXT NOT NULL,
      itemId TEXT NOT NULL,
      itemName TEXT NOT NULL,
      liked INTEGER NOT NULL,
      comments TEXT,
      createdAt TEXT NOT NULL
    )
  `, function(err) {
    if (err) {
      console.error("Error creating feedback table:", err.message);
    } else {
      console.log("Feedback table initialized");
    }
  });
}

// Close the database connection when the app is terminated
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed');
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/auth', authRoutes);
app.use('/spotify', spotifyRoutes);
app.use('/recommendations', recommendationRoutes);

// Home route
app.get('/', (req, res) => {
  res.render('index', { 
    isLoggedIn: req.session.spotifyAccessToken ? true : false 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Something went wrong!' });
});
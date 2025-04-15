// server.js - Main application entry point
const express = require('express');
const path = require('path');
const methodOverride = require('method-override');
const { pool, testConnection } = require('./config/database'); 
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const flash = require('connect-flash');

require('dotenv').config();

// Import routes
const pageRoutes = require('./routes/pageRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session store options
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 minutes
  expiration: 86400000 // 24 hours
});

// Session configuration
app.use(session({
  key: 'media_admin_sid',
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 86400000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' // Only set to true in production
  }
}));

// Flash messages
app.use(flash());

// Auth middleware for templates
app.use((req, res, next) => {
  res.locals.isAuthenticated = !!req.session.adminId;
  res.locals.currentUser = req.session.adminUsername;
  next();
});

// Routes - order matters here; put auth routes first
app.use('/', authRoutes);  // Authentication routes
app.use('/', pageRoutes);  // Page routes
app.use('/', mediaRoutes); // Media routes

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server and test database connection
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    const connected = await testConnection();
    if (connected) {
      console.log('Database connected successfully');
    } else {
      console.log('Database connection failed');
    }
  } catch (error) {
    console.error('Database connection error:', error);
  }
});

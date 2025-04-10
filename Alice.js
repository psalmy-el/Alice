// server.js - Main application entry point
const express = require('express');
const path = require('path');
const multer = require('multer');
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
    httpOnly: true
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


// Routes
app.use('/', pageRoutes);
app.use('/', mediaRoutes);


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on file type
    const isImage = file.mimetype.startsWith('image/');
    const dest = isImage ? './public/uploads/images' : './public/uploads/videos';
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = file.originalname.split('.').pop();
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + extension);
  }
});

const upload = multer({ storage: storage });

// Add middlewares
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method')); // For handling DELETE requests from forms

// Set up route for file uploads
app.post('/upload', upload.single('file'), pageRoutes);
app.post('/edit/:id', upload.single('file'), pageRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server and test database connection
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Test database connection after server starts
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
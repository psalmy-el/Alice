// routes/pageRoutes.js
const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Homepage
router.get('/', pageController.getHomepage);

// About page
router.get('/about', pageController.getAboutPage);

// Contact page
router.get('/contact', pageController.getContactPage);

// Gallery view for a specific media item
router.get('/gallery/:id', pageController.getGalleryPage);

// Dashboard
router.get('/dashboard', isAuthenticated, pageController.getDashboard);

module.exports = router;
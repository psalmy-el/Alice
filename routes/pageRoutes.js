// routes/pageRoutes.js
const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');

// Homepage
router.get('/', pageController.getHomepage);

// About page
router.get('/about', pageController.getAboutPage);

// Contact page
router.get('/contact', pageController.getContactPage);

// Dashboard
router.get('/dashboard', pageController.getDashboard);

module.exports = router;
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

// // Add these new routes
// // Upload page
// router.get('/upload', pageController.getUploadPage);
// router.post('/upload', pageController.uploadMedia);

// // Edit page
// router.get('/edit/:id', pageController.getEditPage);
// router.post('/edit/:id', pageController.updateMedia);

// // Delete route (using method-override middleware for DELETE)
// router.delete('/delete/:id', pageController.deleteMedia);

module.exports = router;
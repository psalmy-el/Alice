// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isGuest, isAuthenticated } = require('../middleware/authMiddleware');

// Login routes
router.get('/login', isGuest, authController.getLoginForm);
router.post('/login', isGuest, authController.login);

// Logout route
router.get('/logout', isAuthenticated, authController.logout);

// Forgot password routes
router.get('/forgot-password', isGuest, authController.getForgotPasswordForm);
router.post('/forgot-password', isGuest, authController.forgotPassword);

// Reset password routes
router.get('/reset-password/:token', isGuest, authController.getResetPasswordForm);
router.post('/reset-password/:token', isGuest, authController.resetPassword);

// Change password route
router.post('/profile/change-password', isAuthenticated, authController.changePassword);

// Profile routes
router.get('/profile', isAuthenticated, authController.getProfile);
router.post('/profile', isAuthenticated, authController.updateProfile);

module.exports = router;
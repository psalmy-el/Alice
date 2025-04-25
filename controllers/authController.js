// controllers/authController.js
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Admin = require('../models/adminModel');
const mailer = require('../config/mailer');

// Display login form
exports.getLoginForm = (req, res) => {
  if (req.session.adminId) {
    return res.redirect('/dashboard');
  }
  res.render('login', { error: req.flash('error') });
};

// Handle login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Get admin by username
    const admin = await Admin.getByUsername(username);
    
    if (!admin) {
      req.flash('error', 'Invalid username or password');
      return res.redirect('/login');
    }
    
    // Compare passwords
    const match = await bcrypt.compare(password, admin.password);
    
    if (!match) {
      req.flash('error', 'Invalid username or password');
      return res.redirect('/login');
    }
    
    // Set session
    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;
    
    // Debug session data
    console.log('Session after login:', {
      id: req.session.id,
      adminId: req.session.adminId,
      adminUsername: req.session.adminUsername
    });
    
    // Explicitly save session before redirect
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      }
      console.log('Session saved successfully');
      res.redirect('/dashboard');
    });
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'An error occurred during login');
    res.redirect('/login');
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/login');
  });
};

// Display forgot password form
exports.getForgotPasswordForm = (req, res) => {
  res.render('forgot-password', { 
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Handle forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if email exists
    const admin = await Admin.getByEmail(email);
    
    if (!admin) {
      req.flash('error', 'No account found with that email');
      return res.redirect('/forgot-password');
    }
    
    // Generate random token
    const token = crypto.randomBytes(20).toString('hex');
    
    // Set token expiration (1 hour)
    const expiresAt = new Date(Date.now() + 3600000);
    
    // Save token to database
    await Admin.createResetToken(email, token, expiresAt);
    
    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${token}?email=${encodeURIComponent(email)}`;
    
    // Send email
    await mailer.sendPasswordReset(email, {
      username: admin.username,
      resetUrl
    });
    
    req.flash('success', 'Password reset link sent to your email');
    res.redirect('/forgot-password');
  } catch (error) {
    console.error('Forgot password error:', error);
    req.flash('error', 'Failed to send password reset email');
    res.redirect('/forgot-password');
  }
};

// Display reset password form
exports.getResetPasswordForm = (req, res) => {
  const { token } = req.params;
  const { email } = req.query;
  
  if (!token || !email) {
    req.flash('error', 'Invalid reset link');
    return res.redirect('/forgot-password');
  }
  
  res.render('reset-password', { 
    token,
    email,
    error: req.flash('error')
  });
};

// Handle reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { email, password, confirm_password } = req.body;
    
    // Validate passwords
    if (password !== confirm_password) {
      req.flash('error', 'Passwords do not match');
      return res.redirect(`/reset-password/${token}?email=${encodeURIComponent(email)}`);
    }
    
    // Verify token
    const isValid = await Admin.verifyResetToken(email, token);
    
    if (!isValid) {
      req.flash('error', 'Password reset link is invalid or has expired');
      return res.redirect('/forgot-password');
    }
    
    // Get admin by email
    const admin = await Admin.getByEmail(email);
    
    if (!admin) {
      req.flash('error', 'No account found with that email');
      return res.redirect('/forgot-password');
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password
    await Admin.updatePassword(admin.id, hashedPassword);
    
    // Delete reset token
    await Admin.deleteResetToken(email);
    
    // Send confirmation email
    await mailer.sendPasswordChangeNotification(email, {
      username: admin.username
    });
    
    req.flash('success', 'Password reset successful. You can now login with your new password.');
    res.redirect('/login');
  } catch (error) {
    console.error('Reset password error:', error);
    req.flash('error', 'Failed to reset password');
    res.redirect('/forgot-password');
  }
};

// Display admin profile
exports.getProfile = async (req, res) => {
  try {
    const admin = await Admin.getByUsername(req.session.adminUsername);
    
    if (!admin) {
      req.session.destroy();
      return res.redirect('/login');
    }
    
    res.render('profile', { 
      admin,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    console.error('Profile error:', error);
    req.flash('error', 'Failed to load profile');
    res.redirect('/dashboard');
  }
};

// Handle profile update
exports.updateProfile = async (req, res) => {
  try {
    const { username, email, current_password } = req.body;
    
    // Get admin
    const admin = await Admin.getByUsername(req.session.adminUsername);
    
    if (!admin) {
      req.session.destroy();
      return res.redirect('/login');
    }
    
    // Verify current password
    const match = await bcrypt.compare(current_password, admin.password);
    
    if (!match) {
      req.flash('error', 'Current password is incorrect');
      return res.redirect('/profile');
    }
    
    // Update details
    await Admin.updateDetails(admin.id, { username, email });
    
    // Update session
    req.session.adminUsername = username;
    
    // Send notification email if email changed
    if (email !== admin.email) {
      await mailer.sendEmailChangeNotification(admin.email, {
        username: admin.username,
        newEmail: email
      });
    }
    
    req.flash('success', 'Profile updated successfully');
    res.redirect('/profile');
  } catch (error) {
    console.error('Update profile error:', error);
    req.flash('error', 'Failed to update profile');
    res.redirect('/profile');
  }
};
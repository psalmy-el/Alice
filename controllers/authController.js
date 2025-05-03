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
    
    // Update last login timestamp
    await Admin.updateLastLogin(admin.id);
    
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
    const emailSent = await mailer.sendPasswordReset(email, {
      username: admin.username,
      resetUrl
    });
    
    if (emailSent) {
      req.flash('success', 'Password reset link sent to your email');
    } else {
      // If email fails, show the token on screen (not ideal for production, but works for development)
      console.log('Using fallback for reset URL display due to email failure');
      req.flash('success', `Email sending failed. Use this link to reset: ${resetUrl}`);
    }
    
    res.redirect('/forgot-password');
  } catch (error) {
    console.error('Forgot password error:', error);
    req.flash('error', 'Failed to process password reset request');
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
    
    // Try to send confirmation email, but don't fail if it doesn't work
    try {
      await mailer.sendPasswordChangeNotification(email, {
        username: admin.username
      });
    } catch (emailError) {
      console.error('Email notification failed, but password was reset:', emailError);
      // We'll continue anyway since the password was reset successfully
    }
    
    req.flash('success', 'Password reset successful. You can now login with your new password.');
    res.redirect('/login');
  } catch (error) {
    console.error('Reset password error:', error);
    req.flash('error', 'Failed to reset password');
    res.redirect('/forgot-password');
  }
};

// Handle password change
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password, confirm_new_password } = req.body;
    
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
    
    // Validate new password
    if (new_password !== confirm_new_password) {
      req.flash('error', 'New passwords do not match');
      return res.redirect('/profile');
    }
    
    // Check password strength
    if (new_password.length < 8) {
      req.flash('error', 'Password must be at least 8 characters long');
      return res.redirect('/profile');
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    // Update password
    await Admin.updatePassword(admin.id, hashedPassword);
    
    // Send confirmation email
    const emailSent = await mailer.sendPasswordChangeNotification(admin.email, {
      username: admin.username
    });
    
    if (emailSent) {
      console.log('Password change notification email sent successfully');
    } else {
      console.warn('Failed to send password change notification email');
    }
    
    req.flash('success', 'Password changed successfully');
    res.redirect('/profile');
  } catch (error) {
    console.error('Change password error:', error);
    req.flash('error', 'Failed to change password');
    res.redirect('/profile');
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
    
    // Create a new object without the password field
    const safeAdmin = { ...admin };
    delete safeAdmin.password;  // Remove password hash from the object
    
    res.render('profile', { 
      admin: safeAdmin,  // Pass the cleaned object to the template
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
    
    // Send notification email if email changed, but don't fail if it doesn't work
    if (email !== admin.email) {
      try {
        await mailer.sendEmailChangeNotification(admin.email, {
          username: admin.username,
          newEmail: email
        });
      } catch (emailError) {
        console.error('Email notification failed, but profile was updated:', emailError);
        // We'll continue anyway since the profile was updated successfully
      }
    }
    
    req.flash('success', 'Profile updated successfully');
    res.redirect('/profile');
  } catch (error) {
    console.error('Update profile error:', error);
    req.flash('error', 'Failed to update profile');
    res.redirect('/profile');
  }
};
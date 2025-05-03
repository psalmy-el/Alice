// config/mailer.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter object
let transporter = null;

// Initialize the email transporter
function initializeTransporter() {
  // Check if we have the required environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.warn('⚠️ Email credentials not properly configured in .env file');
    console.warn('Required variables:');
    console.warn('- EMAIL_USER:', process.env.EMAIL_USER ? '✓ Found' : '✗ Missing');
    console.warn('- EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? '✓ Found' : '✗ Missing');
    console.warn('- EMAIL_FROM (optional):', process.env.EMAIL_FROM ? '✓ Found' : '✗ Missing');
    return false;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
  
  return true;
}

// Test email connection
async function testConnection() {
  try {
    // Initialize the transporter if not already done
    if (!transporter && !initializeTransporter()) {
      console.error('❌ Failed to initialize email transporter');
      return false;
    }
    
    await transporter.verify();
    console.log('✅ Email server connection successful');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error.message);
    return false;
  }
}

// Send password reset email
async function sendPasswordReset(email, data) {
  try {
    // Initialize the transporter if not already done
    if (!transporter && !initializeTransporter()) {
      console.error('Failed to initialize email transporter');
      return false;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Alice Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>Hello ${data.username},</p>
        <p>You have requested to reset your password. Click the link below to reset your password:</p>
        <p><a href="${data.resetUrl}">Reset Your Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Regards,<br>Alice Admin Team</p>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}:`, info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // Don't throw here - we'll handle this error in the controller
    return false;
  }
}

// Send password change notification
async function sendPasswordChangeNotification(email, data) {
  try {
    // Initialize the transporter if not already done
    if (!transporter && !initializeTransporter()) {
      console.error('Failed to initialize email transporter');
      return false;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Alice Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Changed',
      html: `
        <h1>Password Changed</h1>
        <p>Hello ${data.username},</p>
        <p>Your password has been successfully changed.</p>
        <p>If you did not make this change, please contact the administrator immediately.</p>
        <p>Regards,<br>Alice Admin Team</p>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`Password change notification sent to ${email}:`, info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send password change notification:', error);
    // Don't throw here - we'll handle this error in the controller
    return false;
  }
}

// Send email change notification
async function sendEmailChangeNotification(oldEmail, data) {
  try {
    // Initialize the transporter if not already done
    if (!transporter && !initializeTransporter()) {
      console.error('Failed to initialize email transporter');
      return false;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Alice Admin" <${process.env.EMAIL_USER}>`,
      to: oldEmail,
      subject: 'Email Address Changed',
      html: `
        <h1>Email Address Changed</h1>
        <p>Hello ${data.username},</p>
        <p>Your email address has been changed to ${data.newEmail}.</p>
        <p>If you did not make this change, please contact the administrator immediately.</p>
        <p>Regards,<br>Alice Admin Team</p>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email change notification sent to ${oldEmail}:`, info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send email change notification:', error);
    // Don't throw here - we'll handle this error in the controller
    return false;
  }
}

// Initialize the transporter on module load
initializeTransporter();

module.exports = {
  testConnection,
  sendPasswordReset,
  sendPasswordChangeNotification,
  sendEmailChangeNotification
};
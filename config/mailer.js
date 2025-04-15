// config/mailer.js
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const handlebars = require('handlebars');

// Create transporter with environment variables
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// Load email template
async function loadTemplate(templateName) {
  const filePath = path.join(__dirname, '../views', `${templateName}.ejs`);
  const templateContent = await fs.readFile(filePath, 'utf-8');
  return handlebars.compile(templateContent);
}

// Send password reset email
exports.sendPasswordReset = async (to, data) => {
  const template = await loadTemplate('password-reset-email');
  const html = template(data);
  
  await transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to,
    subject: 'Password Reset Request',
    html
  });
};

// Send password change notification
exports.sendPasswordChangeNotification = async (to, data) => {
  const template = await loadTemplate('password-changed-email');
  const html = template(data);
  
  await transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to,
    subject: 'Your Password Has Been Changed',
    html
  });
};

// Send email change notification
exports.sendEmailChangeNotification = async (to, data) => {
  const template = await loadTemplate('email-changed-email');
  const html = template(data);
  
  await transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to,
    subject: 'Your Email Address Has Been Changed',
    html
  });
};  
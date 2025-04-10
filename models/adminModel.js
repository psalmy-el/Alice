// models/adminModel.js
const db = require('../config/database');
const bcrypt = require('bcrypt');

class Admin {
  // Get admin by username
  static async getByUsername(username) {
    const query = `
      SELECT * FROM admins WHERE username = ?
    `;
    
    const [rows] = await db.execute(query, [username]);
    return rows.length > 0 ? rows[0] : null;
  }
  
  // Get admin by email
  static async getByEmail(email) {
    const query = `
      SELECT * FROM admins WHERE email = ?
    `;
    
    const [rows] = await db.execute(query, [email]);
    return rows.length > 0 ? rows[0] : null;
  }
  
  // Update password
  static async updatePassword(adminId, hashedPassword) {
    const query = `
      UPDATE admins SET password = ? WHERE id = ?
    `;
    
    await db.execute(query, [hashedPassword, adminId]);
    return true;
  }
  
  // Create password reset token
  static async createResetToken(email, token, expiresAt) {
    // First check if a token already exists for this email
    const checkQuery = `
      SELECT * FROM password_resets WHERE email = ?
    `;
    
    const [existingTokens] = await db.execute(checkQuery, [email]);
    
    if (existingTokens.length > 0) {
      // Update existing token
      const updateQuery = `
        UPDATE password_resets SET token = ?, expires_at = ? WHERE email = ?
      `;
      await db.execute(updateQuery, [token, expiresAt, email]);
    } else {
      // Create new token
      const insertQuery = `
        INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)
      `;
      await db.execute(insertQuery, [email, token, expiresAt]);
    }
    
    return true;
  }
  
  // Verify reset token
  static async verifyResetToken(email, token) {
    const query = `
      SELECT * FROM password_resets 
      WHERE email = ? AND token = ? AND expires_at > NOW()
    `;
    
    const [rows] = await db.execute(query, [email, token]);
    return rows.length > 0;
  }
  
  // Delete reset token
  static async deleteResetToken(email) {
    const query = `
      DELETE FROM password_resets WHERE email = ?
    `;
    
    await db.execute(query, [email]);
    return true;
  }
  
  // Update admin details
  static async updateDetails(adminId, details) {
    const query = `
      UPDATE admins SET username = ?, email = ? WHERE id = ?
    `;
    
    await db.execute(query, [details.username, details.email, adminId]);
    return true;
  }
}

module.exports = Admin;
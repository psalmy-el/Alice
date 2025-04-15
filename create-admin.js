// create-admin.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./config/database');

async function createAdmin() {
  try {
    // Admin details - customize these!
    const adminDetails = {
      username: 'Alice',
      email: 'abedusamuel@gmail.com',
      password: 'Alice123@'  // Change this to a secure password
    };

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminDetails.password, saltRounds);

    // Check if admin already exists
    const [existingAdmin] = await db.execute(
      'SELECT * FROM admins WHERE username = ? OR email = ?',
      [adminDetails.username, adminDetails.email]
    );

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    // Insert admin into database
    await db.execute(
      'INSERT INTO admins (username, email, password) VALUES (?, ?, ?)',
      [adminDetails.username, adminDetails.email, hashedPassword]
    );

    console.log('Admin user created successfully!');
    
    // Create password_resets table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Password reset table verified.');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();